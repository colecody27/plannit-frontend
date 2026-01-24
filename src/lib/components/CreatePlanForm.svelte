<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { createPlan } from '$lib/api/plans';
  import LocationAutocomplete from '$lib/components/LocationAutocomplete.svelte';

  const planTypes = [
    { id: 'trip', label: 'Trip', description: 'Getaways & vacations', disabled: false },
    { id: 'event', label: 'Event', description: 'Parties & meetups', disabled: true },
    { id: 'group', label: 'Group Buy', description: 'Shared purchases', disabled: true }
  ];

  let selectedType = 'trip';
  let allowBuyIn = true;
  let planName = '';
  let planDescription = '';
  let planDeadline = '';
  let deadlineOpen = false;
  let deadlineContainer: HTMLDivElement | null = null;
  let startDay = '';
  let endDay = '';
  let planLocation = '';
  let planCountry = '';
  let planState = '';
  let planCity = '';
  let errorMessage = '';
  let dateError = '';
  let isSubmitting = false;
  export let showBuyIn = false;

  onMount(async () => {
    await import('cally');
    const handleClickOutside = (event: MouseEvent) => {
      if (!deadlineOpen || !deadlineContainer) {
        return;
      }
      const target = event.target as Node | null;
      if (target && deadlineContainer.contains(target)) {
        return;
      }
      deadlineOpen = false;
    };
    window.addEventListener('click', handleClickOutside);
    onDestroy(() => {
      window.removeEventListener('click', handleClickOutside);
    });
  });

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const startOfDay = (value: Date) =>
    new Date(value.getFullYear(), value.getMonth(), value.getDate());
  const parseLocalDate = (value: string) => {
    const [year, month, day] = value.split('-').map(Number);
    if (!year || !month || !day) {
      return null;
    }
    return new Date(year, month - 1, day);
  };
  const normalizeCalendarDate = (value: Date) =>
    new Date(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate());
  const minSelectableDate = formatDate(new Date());
  $: deadlineMaxDate = startDay || undefined;

  const handleRangeStart = (event: CustomEvent<Date>) => {
    const today = startOfDay(new Date());
    const selected = startOfDay(normalizeCalendarDate(event.detail));
    if (selected < today) {
      dateError = 'Start date cannot be in the past.';
      return;
    }
    dateError = '';
    startDay = formatDate(selected);
    endDay = '';
  };

  const handleRangeEnd = (event: CustomEvent<Date>) => {
    const selectedEnd = startOfDay(normalizeCalendarDate(event.detail));
    if (startDay) {
      const parsedStart = parseLocalDate(startDay);
      const selectedStart = parsedStart ? startOfDay(parsedStart) : null;
      if (selectedStart && selectedEnd < selectedStart) {
        dateError = 'End date cannot be before the start date.';
        return;
      }
    }
    dateError = '';
    endDay = formatDate(selectedEnd);
  };

  const handleDeadlineSelect = (event: CustomEvent<Date>) => {
    const selected = normalizeCalendarDate(event.detail);
    planDeadline = formatDate(selected);
    deadlineOpen = false;
  };



  const handleSubmit = async () => {
    errorMessage = '';
    const trimmedName = planName.trim();
    if (!trimmedName) {
      errorMessage = 'Plan name is required.';
      return;
    }
    if (dateError) {
      return;
    }
    if (planDeadline && startDay) {
      const parsedDeadline = parseLocalDate(planDeadline);
      const parsedStart = parseLocalDate(startDay);
      const deadlineDate = parsedDeadline ? startOfDay(parsedDeadline) : null;
      const startDate = parsedStart ? startOfDay(parsedStart) : null;
      if (deadlineDate && startDate && deadlineDate > startDate) {
        dateError = 'Commitment deadline must be on or before the start day.';
        return;
      }
    }
    if (startDay) {
      const today = startOfDay(new Date());
      const parsed = parseLocalDate(startDay);
      const selected = parsed ? startOfDay(parsed) : null;
      if (selected && selected < today) {
        dateError = 'Start date cannot be in the past.';
        return;
      }
    }
    if (startDay && endDay) {
      const parsedStart = parseLocalDate(startDay);
      const parsedEnd = parseLocalDate(endDay);
      const selectedStart = parsedStart ? startOfDay(parsedStart) : null;
      const selectedEnd = parsedEnd ? startOfDay(parsedEnd) : null;
      if (selectedStart && selectedEnd && selectedStart > selectedEnd) {
        dateError = 'End date cannot be before the start date.';
        return;
      }
    }

    isSubmitting = true;
    try {
      const payloadType = selectedType === 'group' ? 'group_purchase' : selectedType;
      const response = await createPlan({
        name: trimmedName,
        description: planDescription.trim() || undefined,
        type: payloadType,
        deadline: planDeadline ? new Date(planDeadline).toISOString() : undefined,
        start_day: startDay ? new Date(startDay).toISOString() : undefined,
        end_day: endDay ? new Date(endDay).toISOString() : undefined,
        country: planCountry || undefined,
        state: planState || undefined,
        city: planCity || undefined
      });
      await goto(`/plans/${response.data.id}/organizer`);
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Unable to create plan.';
    } finally {
      isSubmitting = false;
    }
  };
</script>

<div class="card bg-base-100 border border-base-200 shadow-sm max-w-6xl mx-auto">
  <form class="card-body gap-6" on:submit|preventDefault={handleSubmit}>
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold">1. Plan Type</h2>
    </div>
    <div class="grid gap-4 md:grid-cols-3">
      {#each planTypes as type}
        <button
          class={`rounded-2xl border p-4 text-left transition ${
            type.disabled
              ? 'border-base-200 bg-base-100/70 text-base-content/40 cursor-not-allowed'
              : selectedType === type.id
                ? 'border-primary bg-primary/5 shadow-sm'
                : 'border-base-200 hover:border-primary/60'
          }`}
          disabled={type.disabled}
          type="button"
          on:click={() => {
            if (!type.disabled) {
              selectedType = type.id;
            }
          }}
        >
          <div class="h-10 w-10 rounded-2xl bg-base-200 mb-3"></div>
          <h3 class="font-semibold">{type.label}</h3>
          <p class="text-sm text-base-content/60">{type.description}</p>
        </button>
      {/each}
    </div>

    <div class="space-y-4">
      <h2 class="text-lg font-semibold">2. The Details</h2>
      <label class="form-control">
        <span class="label-text">What are we calling this?</span>
        <input
          class="input input-bordered"
          placeholder="Tahoe Ski Trip 2024"
          bind:value={planName}
        />
      </label>
      <div>
        <span class="label-text">Cover Image</span>
        <div class="mt-2 rounded-2xl border border-base-200 overflow-hidden">
          <img
            class="h-44 w-full object-cover"
            src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80"
            alt="Cover"
          />
        </div>
      </div>
      <label class="form-control">
        <span class="label-text">What's the plan?</span>
        <textarea
          class="textarea textarea-bordered h-28"
          placeholder="Add details about the itinerary, what to bring, etc..."
          bind:value={planDescription}
        ></textarea>
      </label>
      <LocationAutocomplete
        label="Location"
        bind:location={planLocation}
        bind:country={planCountry}
        bind:state={planState}
        bind:city={planCity}
        singleInput={true}
        idPrefix="plan-location"
      />
      <label class="form-control">
        <span class="label-text">Dates</span>
        <span class="text-xs text-base-content/60">Pick a start and end date.</span>
        <div class="mt-3 rounded-2xl border border-base-200 p-3 flex justify-center">
          <calendar-range
            months={1}
            min={minSelectableDate}
            page-by="single"
            on:rangestart={handleRangeStart}
            on:rangeend={handleRangeEnd}
          >
            <calendar-month></calendar-month>
          </calendar-range>
        </div>
        {#if dateError}
          <p class="mt-2 text-xs text-error">{dateError}</p>
        {/if}
      </label>
      <div class="grid gap-3 md:grid-cols-2">
        <label class="form-control">
          <span class="label-text">Start day</span>
          <input
            class="input input-bordered"
            type="text"
            placeholder="Select start day"
            bind:value={startDay}
            readonly
          />
        </label>
        <label class="form-control">
          <span class="label-text">End day</span>
          <input
            class="input input-bordered"
            type="text"
            placeholder="Select end day"
            bind:value={endDay}
            readonly
          />
        </label>
      </div>
      <div class="form-control" bind:this={deadlineContainer}>
        <span class="label-text">Commitment deadline</span>
        <span class="text-xs text-base-content/60">When do people need to commit by?</span>
        <div class="relative mt-2">
          <input
            class="input input-bordered w-full"
            type="text"
            placeholder="Select deadline"
            value={planDeadline}
            readonly
            on:click={() => (deadlineOpen = !deadlineOpen)}
          />
          {#if deadlineOpen}
            <div
              class="absolute z-20 mt-2 w-fit max-w-full rounded-2xl border border-base-200 bg-base-100 p-3 shadow-lg"
              on:click|stopPropagation
            >
              <calendar-range
                months={1}
                min={minSelectableDate}
                max={deadlineMaxDate}
                page-by="single"
                on:rangestart={handleDeadlineSelect}
                on:rangeend={handleDeadlineSelect}
              >
                <calendar-month></calendar-month>
              </calendar-range>
              <div class="mt-3 flex items-center justify-between">
                <button
                  class="btn btn-ghost btn-sm"
                  type="button"
                  on:click={() => (planDeadline = '')}
                >
                  Clear
                </button>
                <button
                  class="btn btn-outline btn-sm"
                  type="button"
                  on:click={() => (deadlineOpen = false)}
                >
                  Done
                </button>
              </div>
            </div>
          {/if}
        </div>
      </div>
      {#if showBuyIn}
        <div class="flex items-center justify-between rounded-2xl border border-base-200 p-4">
          <div>
            <p class="font-semibold">Allow buy-in?</p>
            <p class="text-sm text-base-content/60">Participants can chip in toward the total cost.</p>
          </div>
          <input type="checkbox" class="toggle toggle-primary" bind:checked={allowBuyIn} />
        </div>
      {/if}
    </div>

    {#if errorMessage}
      <div class="alert alert-error text-sm">
        {errorMessage}
      </div>
    {/if}

    <div class="flex items-center justify-between">
      <button class="btn btn-outline">Back</button>
      <button class="btn btn-primary" type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating...' : 'Create Plan ->'}
      </button>
    </div>
  </form>
</div>

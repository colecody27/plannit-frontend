<script lang="ts">
  import { onMount } from 'svelte';
  import AppNav from '$lib/components/AppNav.svelte';
  import Avatar from '$lib/components/Avatar.svelte';
  import PlanHeader from '$lib/components/PlanHeader.svelte';
  import PlanStats from '$lib/components/PlanStats.svelte';
  import ItineraryTimeline from '$lib/components/ItineraryTimeline.svelte';
  import ParticipantsCard from '$lib/components/ParticipantsCard.svelte';
  import ChatPanel from '$lib/components/ChatPanel.svelte';
  import { formatShortDate } from '$lib/models/plan';
  import { apiFetch } from '$lib/api/client';

  const props = $props();
  const venmoHandle = props.data.profile?.venmoHandle ?? '';
  const hostName = props.data.profile?.name ?? 'Plan Organizer';
  const hostAvatar = props.data.profile?.avatar ?? null;
  const hostInitials = hostName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'PO';
  let inviteLink = $state('');
  let inviteStatus = $state('');
  let isInviteLoading = $state(false);
  let inviteModalOpen = $state(false);
  let copiedInvite = $state(false);
  let addActivityOpen = $state(false);
  let activityName = $state('');
  let activityLink = $state('');
  let activityDetails = $state('');
  let activityCost = $state('');
  let activityStartDay = $state('');
  let activityEndDay = $state('');
  let isAllDay = $state(false);
  let activityStartTime = $state('');
  let activityEndTime = $state('');
  let activityError = $state('');
  let isActivitySaving = $state(false);

  const formatTimeline = () => {
    const start = props.data.plan?.startDay ?? null;
    const end = props.data.plan?.endDay ?? null;
    if (start && end) {
      const startLabel = formatShortDate(start);
      const endLabel = formatShortDate(end);
      return startLabel === endLabel ? startLabel : `${startLabel} - ${endLabel}`;
    }
    if (start) {
      return formatShortDate(start);
    }
    if (end) {
      return formatShortDate(end);
    }
    return 'Timeline TBD';
  };

  onMount(async () => {
    await import('cally');
  });

  const formatCost = () => {
    const parsed = Number(activityCost);
    if (Number.isNaN(parsed)) {
      activityCost = '';
      return;
    }
    activityCost = parsed.toFixed(2);
  };

  const formatDate = (date: Date) => date.toISOString().slice(0, 10);

  const handleActivityRangeStart = (event: CustomEvent<Date>) => {
    activityStartDay = formatDate(event.detail);
    activityEndDay = '';
  };

  const handleActivityRangeEnd = (event: CustomEvent<Date>) => {
    activityEndDay = formatDate(event.detail);
  };

  const buildDateTime = (date: string, time: string) => {
    if (!date) {
      return undefined;
    }
    const safeTime = time || '00:00';
    return new Date(`${date}T${safeTime}`).toISOString();
  };

  const resetActivityForm = () => {
    activityName = '';
    activityLink = '';
    activityDetails = '';
    activityCost = '';
    activityStartDay = '';
    activityEndDay = '';
    isAllDay = false;
    activityStartTime = '';
    activityEndTime = '';
    activityError = '';
  };

  const handleSaveActivity = async () => {
    if (isActivitySaving) {
      return;
    }
    activityError = '';

    const trimmedName = activityName.trim();
    if (!trimmedName) {
      activityError = 'Activity name is required.';
      return;
    }

    const planId = props.data.plan?.id;
    if (!planId) {
      activityError = 'Plan is unavailable.';
      return;
    }

    isActivitySaving = true;
    try {
      const startTime = buildDateTime(activityStartDay, isAllDay ? '' : activityStartTime);
      const endBase = activityEndDay || activityStartDay;
      const endTime = buildDateTime(endBase, isAllDay ? '' : activityEndTime);

      await apiFetch(`/plan/${planId}/activity/create`, {
        method: 'PUT',
        body: JSON.stringify({
          name: trimmedName,
          description: activityDetails.trim() || undefined,
          link: activityLink.trim() || undefined,
          cost: activityCost ? Number(activityCost) : undefined,
          start_time: startTime,
          end_time: endTime
        })
      });

      addActivityOpen = false;
      resetActivityForm();
    } catch (error) {
      activityError = error instanceof Error ? error.message : 'Unable to save activity.';
    } finally {
      isActivitySaving = false;
    }
  };

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
    } catch (error) {
      // Fallback to still show feedback even if clipboard is blocked.
    }
    copiedInvite = true;
    setTimeout(() => {
      copiedInvite = false;
    }, 2000);
  };

  const loadInviteLink = async () => {
    if (isInviteLoading || inviteLink) {
      return;
    }

    inviteStatus = '';
    const planId = props.data.plan?.id;
    if (!planId) {
      inviteStatus = 'Invite link unavailable.';
      return;
    }

    isInviteLoading = true;
    try {
      const payload = await apiFetch<{ success: boolean; data?: { link?: string } }>(
        `/plan/${planId}/invite`
      );
      if (payload?.success && payload?.data?.link) {
        const rawLink = payload.data.link;
        const inviteId = payload.data.id ?? rawLink;
        const resolvedPlanId = payload.data.plan_id ?? planId;
        inviteLink = rawLink.startsWith('http')
          ? rawLink
          : `http://localhost:5000/plan/${resolvedPlanId}/invite/${inviteId}`;
      } else {
        inviteStatus = 'Invite link unavailable.';
      }
    } catch (error) {
      inviteStatus = 'Unable to load invite link right now.';
    } finally {
      isInviteLoading = false;
    }
  };

  $effect(() => {
    if (inviteModalOpen) {
      loadInviteLink();
    }
  });
</script>

<div>
  <AppNav />
  <main class="px-6 lg:px-16 pb-20">
    <section class="section-spacing space-y-8">
      {#if props.data.statusMessage}
        <div class="alert alert-error text-sm">
          {props.data.statusMessage}
        </div>
      {:else if props.data.plan}
        <PlanHeader
          title={props.data.plan.title}
          dateRange={formatTimeline()}
          location={props.data.plan.location}
          inviteTargetId="invite-modal"
          showMeta={false}
          onInvite={loadInviteLink}
        />
        <div class="card bg-base-100 border border-base-200 shadow-sm">
          <div class="card-body">
            <div class="overflow-hidden rounded-2xl border border-base-200">
              <img
                class="h-48 w-full object-cover"
                src={props.data.plan.coverImage}
                alt="Plan cover"
              />
            </div>
            <div class="mt-4 flex items-center gap-3">
              <Avatar
                initials={hostInitials}
                size="lg"
                status="none"
                imageUrl={hostAvatar}
                innerClass="bg-primary/15 text-primary ring-2 ring-primary/30"
              />
              <div class="text-sm">
                <p class="text-base-content/60">Hosted by</p>
                <p class="font-semibold">{hostName}</p>
              </div>
            </div>
            <h3 class="text-lg font-semibold mt-4">Plan description</h3>
            <p class="text-sm text-base-content/70">{props.data.plan.description}</p>
            <div class="mt-5 grid gap-4 md:grid-cols-2">
              <div class="rounded-2xl border border-base-200 bg-base-100 p-4">
                <div class="flex items-center gap-2 text-xs uppercase tracking-wide text-base-content/50">
                  <svg
                    class="h-4 w-4 text-base-content/50"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M6 2a1 1 0 0 1 1 1v1h6V3a1 1 0 1 1 2 0v1h1a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1V3a1 1 0 0 1 1-1Zm10 7H4v6a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V9Z"
                      clip-rule="evenodd"
                    />
                  </svg>
                  <span>When</span>
                </div>
                <p class="mt-2 text-sm font-semibold text-base-content">{formatTimeline()}</p>
              </div>
              <div class="rounded-2xl border border-base-200 bg-base-100 p-4">
                <div class="flex items-center gap-2 text-xs uppercase tracking-wide text-base-content/50">
                  <svg
                    class="h-4 w-4 text-base-content/50"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M9.69 18.933a1 1 0 0 1-1.38 0C5.425 16.31 3 13.469 3 10.5A7 7 0 1 1 17 10.5c0 2.969-2.425 5.81-5.31 8.433ZM10 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"
                      clip-rule="evenodd"
                    />
                  </svg>
                  <span>Where</span>
                </div>
                <p class="mt-2 text-sm font-semibold text-base-content">
                  {props.data.plan.location}
                </p>
              </div>
            </div>
          </div>
        </div>
        {#if !venmoHandle}
          <div class="alert alert-warning">
            <span>
              Add your Venmo handle to enable faster buy-in payouts.
              <a class="link link-hover ml-1" href="/profile">Update profile</a>
            </span>
          </div>
        {/if}
        <PlanStats
          budget={props.data.plan.goal}
          collected={props.data.plan.raised}
          perPerson={props.data.plan.perPerson}
          countdown="12 Days"
        />

        <div class="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <div class="space-y-6">
            <ItineraryTimeline
              activities={props.data.plan.activities}
              addTargetId="add-activity-modal"
              emphasizeAdd={true}
            />
          </div>
          <div class="space-y-6">
            <ParticipantsCard
              participants={props.data.plan.participants}
              manageTargetId="manage-participants-modal"
            />
            <ChatPanel messages={props.data.plan.chat} />
          </div>
        </div>
      {/if}
    </section>

    <input id="manage-participants-modal" type="checkbox" class="modal-toggle" />
    <div class="modal" role="dialog">
      <div class="modal-box">
        <h3 class="text-lg font-semibold mb-4">Manage Participants</h3>
        <div class="space-y-3">
          {#if props.data.plan}
            {#each props.data.plan.participants as person}
            <div class="flex items-center justify-between rounded-2xl border border-base-200 p-3">
              <div class="flex items-center gap-3">
                <Avatar initials={person.name.slice(0, 1)} status="none" />
                <div>
                  <p class="font-semibold text-sm">{person.name}</p>
                  <p class="text-xs text-base-content/60">{person.status ?? 'participant'}</p>
                </div>
              </div>
              <label class="btn btn-xs btn-outline text-error" for="remove-participant-modal">
                Remove
              </label>
            </div>
            {/each}
          {/if}
        </div>
        <div class="modal-action">
          <label for="manage-participants-modal" class="btn btn-outline">Done</label>
        </div>
      </div>
      <label class="modal-backdrop" for="manage-participants-modal">Close</label>
    </div>

    <input id="add-activity-modal" type="checkbox" class="modal-toggle" bind:checked={addActivityOpen} />
    <div class="modal" role="dialog">
      <div class="modal-box">
        <h3 class="text-lg font-semibold mb-4">Add Activity</h3>
        <div class="space-y-3">
          <label class="form-control">
            <span class="label-text">Activity name</span>
            <input class="input input-bordered" placeholder="Arrival & Check-in" bind:value={activityName} />
          </label>
          <label class="form-control">
            <span class="label-text">Timeframe</span>
            <div class="rounded-2xl border border-base-200 p-3 flex justify-center">
              <calendar-range
                months="1"
                page-by="single"
                on:rangestart={handleActivityRangeStart}
                on:rangeend={handleActivityRangeEnd}
              >
                <calendar-month></calendar-month>
              </calendar-range>
            </div>
          </label>
          <div class="grid gap-3 md:grid-cols-2">
            <label class="form-control">
              <span class="label-text">Start day</span>
              <input
                class="input input-bordered"
                type="text"
                placeholder="Select start day"
                bind:value={activityStartDay}
                readonly
              />
            </label>
            <label class="form-control">
              <span class="label-text">End day</span>
              <input
                class="input input-bordered"
                type="text"
                placeholder="Select end day"
                bind:value={activityEndDay}
                readonly
              />
            </label>
          </div>
          <div class="flex items-center justify-between rounded-2xl border border-base-200 px-4 py-3 text-sm">
            <div>
              <p class="font-semibold">All-day</p>
              <p class="text-xs text-base-content/60">Hide start and end time.</p>
            </div>
            <input type="checkbox" class="toggle toggle-primary" bind:checked={isAllDay} />
          </div>
          {#if !isAllDay}
            <div class="grid gap-3 md:grid-cols-2">
              <label class="form-control">
                <span class="label-text">Start time</span>
                <input class="input input-bordered" type="time" bind:value={activityStartTime} />
              </label>
              <label class="form-control">
                <span class="label-text">End time</span>
                <input class="input input-bordered" type="time" bind:value={activityEndTime} />
              </label>
            </div>
          {/if}
          <label class="form-control">
            <span class="label-text">Link</span>
            <input class="input input-bordered" placeholder="https://maps.google.com" bind:value={activityLink} />
          </label>
          <label class="form-control">
            <span class="label-text">Cost</span>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-base-content/60">
                $
              </span>
              <input
                class="input input-bordered w-full pl-7"
                placeholder="0.00"
                inputmode="decimal"
                pattern="^\\d*(\\.\\d{0,2})?$"
                min="0"
                step="0.01"
                bind:value={activityCost}
                on:blur={formatCost}
              />
            </div>
          </label>
          <label class="form-control">
            <span class="label-text">Details</span>
            <textarea
              class="textarea textarea-bordered h-24"
              placeholder="Add activity details."
              bind:value={activityDetails}
            ></textarea>
          </label>
        </div>
        {#if activityError}
          <p class="text-xs text-error mt-3">{activityError}</p>
        {/if}
        <div class="modal-action">
          <label for="add-activity-modal" class="btn btn-outline">Cancel</label>
          <button class="btn btn-primary" on:click={handleSaveActivity} disabled={isActivitySaving}>
            {isActivitySaving ? 'Saving...' : 'Save Activity'}
          </button>
        </div>
      </div>
      <label class="modal-backdrop" for="add-activity-modal">Close</label>
    </div>

    <input id="remove-participant-modal" type="checkbox" class="modal-toggle" />
    <div class="modal" role="dialog">
      <div class="modal-box">
        <h3 class="text-lg font-semibold mb-3 text-error">Remove participant?</h3>
        <p class="text-sm text-base-content/70">
          They will lose access to the itinerary and chat for this plan.
        </p>
        <div class="modal-action">
          <label for="remove-participant-modal" class="btn btn-ghost">Cancel</label>
          <button class="btn btn-error">Remove</button>
        </div>
      </div>
      <label class="modal-backdrop" for="remove-participant-modal">Close</label>
    </div>

    <input id="invite-modal" type="checkbox" class="modal-toggle" bind:checked={inviteModalOpen} />
    <div class="modal" role="dialog">
      <div class="modal-box text-center relative">
        <label for="invite-modal" class="btn btn-ghost btn-sm absolute right-3 top-3">✕</label>
        <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <span class="text-xl">+</span>
        </div>
        <h3 class="text-lg font-semibold mt-4">Invite Friends</h3>
        <p class="text-sm text-base-content/70 mt-1">
          Send this link to friends so they can join the plan.
        </p>
        <input
          class="mt-4 input input-bordered w-full text-sm font-medium"
          readonly
          value={
            inviteLink
              ? inviteLink.replace('https://', '')
              : isInviteLoading
                ? 'Loading invite link...'
                : 'Invite link pending'
          }
        />
        {#if inviteStatus}
          <p class="text-xs text-error mt-2">{inviteStatus}</p>
        {/if}
        <button class="btn btn-primary w-full mt-4" on:click={copyInviteLink} disabled={!inviteLink}>
          {copiedInvite ? 'Invite Link Copied' : 'Copy Invite Link'}
        </button>
      </div>
      <label class="modal-backdrop" for="invite-modal">Close</label>
    </div>
  </main>
</div>

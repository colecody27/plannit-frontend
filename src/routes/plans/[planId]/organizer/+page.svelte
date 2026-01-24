<script lang="ts">
  import { onMount } from 'svelte';
  import AppNav from '$lib/components/AppNav.svelte';
  import Avatar from '$lib/components/Avatar.svelte';
  import PlanHeader from '$lib/components/PlanHeader.svelte';
  import PlanStats from '$lib/components/PlanStats.svelte';
  import ItineraryTimeline from '$lib/components/ItineraryTimeline.svelte';
  import ParticipantsCard from '$lib/components/ParticipantsCard.svelte';
  import ChatPanel from '$lib/components/ChatPanel.svelte';
  import AddActivityModal from '$lib/components/AddActivityModal.svelte';
  import ProposedActivities from '$lib/components/ProposedActivities.svelte';
  import LocationAutocomplete from '$lib/components/LocationAutocomplete.svelte';
  import type { Activity } from '$lib/types';
  import { formatShortDate } from '$lib/models/plan';
  import { apiFetch } from '$lib/api/client';
  import { invalidate } from '$app/navigation';
  import { browser } from '$app/environment';

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
  const hostId = props.data.profile?.id ?? null;
  const hostParticipant = {
    id: hostId ?? 'host',
    name: hostName,
    avatar: hostAvatar ?? undefined,
    status: 'organizer' as const
  };
  let inviteLink = $state('');
  let inviteStatus = $state('');
  let isInviteLoading = $state(false);
  let inviteModalOpen = $state(false);
  let copiedInvite = $state(false);
  let addActivityOpen = $state(false);
  let isEditing = $state(false);
  let isPlanSaving = $state(false);
  let isPlanLocking = $state(false);
  let planSaveError = $state('');
  let planLockError = $state('');
  let planDateError = $state('');
  let planTitle = $state(props.data.plan?.title ?? '');
  let planDescription = $state(props.data.plan?.description ?? '');
  let planLocation = $state(props.data.plan?.location ?? '');
  let planCountry = $state(props.data.plan?.country ?? '');
  let planState = $state(props.data.plan?.state ?? '');
  let planCity = $state(props.data.plan?.city ?? '');
  let planStartDate = $state<Date | null>(props.data.plan?.startDay ?? null);
  let planEndDate = $state<Date | null>(props.data.plan?.endDay ?? null);
  let itineraryTimeline: { openActivityModal: (activity: Activity) => void } | null = null;
  let rejectedCarousel: HTMLDivElement | null = null;
  let activities = $state(props.data.plan?.activities ?? []);
  let originalPlan = $state({
    title: planTitle,
    description: planDescription,
    location: planLocation,
    country: planCountry,
    state: planState,
    city: planCity,
    startDay: planStartDate,
    endDay: planEndDate
  });

  const formatTimeline = () => {
    const start = planStartDate ?? null;
    const end = planEndDate ?? null;
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

  const openRejectedActivity = (activity: Activity) => {
    if (!hostId || activity.proposerId !== hostId || !itineraryTimeline) {
      return;
    }
    itineraryTimeline.openActivityModal(activity);
  };

  const buildInviteLink = (rawLink: string, planId: string, inviteId: string) => {
    const origin = browser ? window.location.origin : '';
    const fallback = origin
      ? `${origin}/plans/${planId}/invite/${inviteId}`
      : `/plans/${planId}/invite/${inviteId}`;

    if (!rawLink) {
      return fallback;
    }

    try {
      if (rawLink.startsWith('http')) {
        const url = new URL(rawLink);
        const path = url.pathname.startsWith('/plan/')
          ? url.pathname.replace(/^\/plan\//, '/plans/')
          : url.pathname;
        return origin ? `${origin}${path}${url.search}` : `${path}${url.search}`;
      }
    } catch (error) {
      return fallback;
    }

    if (rawLink.startsWith('/plan/')) {
      return origin + rawLink.replace(/^\/plan\//, '/plans/');
    }

    if (rawLink.startsWith('/plans/')) {
      return origin + rawLink;
    }

    return fallback;
  };

  const formatCountdown = (start?: Date | null) => {
    if (!start) {
      return 'TBD';
    }
    const diffMs = start.getTime() - Date.now();
    if (diffMs <= 0) {
      return 'Started';
    }
    const minutes = Math.ceil(diffMs / 60000);
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.ceil(diffMs / 3600000);
    if (hours < 24) {
      return `${hours} hr`;
    }
    const days = Math.ceil(diffMs / 86400000);
    return `${days} day${days === 1 ? '' : 's'}`;
  };

  onMount(async () => {
    await import('cally');
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

  const handlePlanRangeStart = (event: CustomEvent<Date>) => {
    const today = startOfDay(new Date());
    const selected = startOfDay(normalizeCalendarDate(event.detail));
    if (selected < today) {
      planDateError = 'Start date cannot be in the past.';
      return;
    }
    planDateError = '';
    planStartDate = selected;
    planEndDate = null;
  };

  const handlePlanRangeEnd = (event: CustomEvent<Date>) => {
    const selectedEnd = startOfDay(normalizeCalendarDate(event.detail));
    if (planStartDate) {
      const selectedStart = startOfDay(planStartDate);
      if (selectedEnd < selectedStart) {
        planDateError = 'End date cannot be before the start date.';
        return;
      }
    }
    planDateError = '';
    planEndDate = selectedEnd;
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
        inviteLink = buildInviteLink(rawLink, resolvedPlanId, inviteId);
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

  const syncPlanFromProps = () => {
    if (!props.data.plan || isEditing) {
      return;
    }
    planTitle = props.data.plan.title ?? '';
    planDescription = props.data.plan.description ?? '';
    planLocation = props.data.plan.location ?? '';
    planCountry = props.data.plan.country ?? '';
    planState = props.data.plan.state ?? '';
    planCity = props.data.plan.city ?? '';
    planStartDate = props.data.plan.startDay ?? null;
    planEndDate = props.data.plan.endDay ?? null;
    originalPlan = {
      title: planTitle,
      description: planDescription,
      location: planLocation,
      country: planCountry,
      state: planState,
      city: planCity,
      startDay: planStartDate,
      endDay: planEndDate
    };
  };

  $effect(syncPlanFromProps);
  $effect(() => {
    activities = props.data.plan?.activities ?? [];
  });

  const handleActivityUpdate = (event: CustomEvent<Activity>) => {
    const updated = event.detail;
    activities = activities.map((activity) =>
      activity.id === updated.id ? updated : activity
    );
  };

  const handleActivityCreated = (event: CustomEvent<Activity>) => {
    const created = event.detail;
    activities = [created, ...activities];
  };

  const togglePlanLock = async () => {
    const planId = props.data.plan?.id;
    if (!planId || isPlanLocking) {
      return;
    }
    planLockError = '';
    isPlanLocking = true;
    try {
      await apiFetch(`/plan/${planId}/lock-toggle`, { method: 'PUT' });
      await invalidate(`/api/plan/${planId}`);
    } catch (error) {
      planLockError = error instanceof Error ? error.message : 'Unable to update plan status.';
    } finally {
      isPlanLocking = false;
    }
  };

  const toDay = (value: Date | null) => (value ? formatDate(value) : null);

  const savePlan = async () => {
    if (isPlanSaving) {
      return;
    }
    planSaveError = '';
    if (planDateError) {
      return;
    }
    const planId = props.data.plan?.id;
    if (!planId) {
      planSaveError = 'Plan is unavailable.';
      return;
    }
    if (planStartDate) {
      const today = startOfDay(new Date());
      const selected = startOfDay(planStartDate);
      if (selected < today) {
        planDateError = 'Start date cannot be in the past.';
        return;
      }
    }
    if (planStartDate && planEndDate) {
      const selectedStart = startOfDay(planStartDate);
      const selectedEnd = startOfDay(planEndDate);
      if (selectedStart > selectedEnd) {
        planDateError = 'End date cannot be before the start date.';
        return;
      }
    }

    const updates: Record<string, unknown> = {};
    if (planTitle.trim() !== originalPlan.title) {
      updates.name = planTitle.trim();
    }
    if (planDescription.trim() !== originalPlan.description) {
      updates.description = planDescription.trim();
    }
    if (planLocation.trim() !== originalPlan.location) {
      updates.location = planLocation.trim();
    }
    if (planCountry.trim() !== originalPlan.country) {
      updates.country = planCountry.trim() || undefined;
    }
    if (planState.trim() !== originalPlan.state) {
      updates.state = planState.trim() || undefined;
    }
    if (planCity.trim() !== originalPlan.city) {
      updates.city = planCity.trim() || undefined;
    }
    const nextStart = toDay(planStartDate);
    const nextEnd = toDay(planEndDate);
    if (nextStart !== toDay(originalPlan.startDay)) {
      updates.start_day = nextStart;
    }
    if (nextEnd !== toDay(originalPlan.endDay)) {
      updates.end_day = nextEnd;
    }

    if (!Object.keys(updates).length) {
      isEditing = false;
      return;
    }

    isPlanSaving = true;
    try {
      await apiFetch(`/plan/${planId}/update`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      await invalidate(`/api/plan/${planId}`);
      originalPlan = {
        title: planTitle.trim(),
        description: planDescription.trim(),
        location: planLocation.trim(),
        country: planCountry.trim(),
        state: planState.trim(),
        city: planCity.trim(),
        startDay: planStartDate,
        endDay: planEndDate
      };
      isEditing = false;
    } catch (error) {
      planSaveError = error instanceof Error ? error.message : 'Unable to save plan.';
    } finally {
      isPlanSaving = false;
    }
  };

  const participantsWithHost = $derived.by(() => {
    const participants = props.data.plan?.participants ?? [];
    const hasHost = participants.some((participant) => {
      if (hostId && participant.id === hostId) {
        return true;
      }
      if (participant.status === 'organizer') {
        return true;
      }
      return participant.name === hostName;
    });
    return hasHost ? participants : [hostParticipant, ...participants];
  });

  const isPlanLocked = $derived.by(
    () => (props.data.plan?.status ?? '').toLowerCase() === 'locked'
  );

  const userTotalCost = $derived.by(() => {
    const profileId = props.data.profile?.id;
    if (!profileId) {
      return 0;
    }
    return activities.reduce((sum, activity) => {
      const hasVote = Array.isArray(activity.votes)
        ? activity.votes.some((vote) => vote.id === profileId)
        : false;
      return hasVote ? sum + (activity.cost ?? 0) : sum;
    }, 0);
  });

  const confirmedTotalCost = $derived.by(() =>
    activities.reduce((sum, activity) => {
      const isConfirmed = activity.status?.toLowerCase() === 'confirmed';
      return isConfirmed ? sum + (activity.costTotal ?? 0) : sum;
    }, 0)
  );

  const rejectedActivities = $derived.by(() =>
    activities.filter((activity) => activity.status?.toLowerCase() === 'rejected')
  );
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
          title={planTitle}
          dateRange={formatTimeline()}
          location={planLocation}
          planStatus={props.data.plan.status}
          inviteTargetId="invite-modal"
          showMeta={false}
          onInvite={loadInviteLink}
          finalizeLabel={isPlanLocked ? 'Unlock Plan' : 'Finalize Plan'}
          finalizeDisabled={isPlanLocking}
          onFinalize={togglePlanLock}
        >
          <button
            slot="edit-action"
            class={`btn ${isEditing ? 'btn-primary' : 'btn-outline'}`}
            type="button"
            on:click={() => {
              if (isEditing) {
                savePlan();
              } else {
                isEditing = true;
              }
            }}
            disabled={isPlanSaving}
          >
            {isEditing ? (isPlanSaving ? 'Saving...' : 'Save') : 'Edit Plan'}
          </button>
        </PlanHeader>
        {#if planSaveError}
          <div class="alert alert-error text-sm">{planSaveError}</div>
        {/if}
        {#if planLockError}
          <div class="alert alert-error text-sm">{planLockError}</div>
        {/if}
        {#if isEditing}
          <div class="rounded-2xl border border-base-200 bg-base-100 p-4">
            <label class="form-control">
              <span class="label-text">Plan title</span>
              <input class="input input-bordered" bind:value={planTitle} />
            </label>
          </div>
        {/if}
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
            {#if isEditing}
              <textarea class="textarea textarea-bordered h-28" bind:value={planDescription}></textarea>
            {:else}
              <p class="text-sm text-base-content/70">{planDescription}</p>
            {/if}
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
                {#if isEditing}
                  <div class="mt-3 space-y-3">
                    <div class="rounded-2xl border border-base-200 p-3 flex justify-center">
                      <calendar-range
                        months={1}
                        min={minSelectableDate}
                        page-by="single"
                        on:rangestart={handlePlanRangeStart}
                        on:rangeend={handlePlanRangeEnd}
                      >
                        <calendar-month></calendar-month>
                      </calendar-range>
                    </div>
                    {#if planDateError}
                      <p class="text-xs text-error">{planDateError}</p>
                    {/if}
                    <div class="grid gap-3 md:grid-cols-2">
                      <label class="form-control">
                        <span class="label-text">Start day</span>
                        <input
                          class="input input-bordered"
                          type="text"
                          readonly
                          value={planStartDate ? formatShortDate(planStartDate) : 'Select start day'}
                        />
                      </label>
                      <label class="form-control">
                        <span class="label-text">End day</span>
                        <input
                          class="input input-bordered"
                          type="text"
                          readonly
                          value={planEndDate ? formatShortDate(planEndDate) : 'Select end day'}
                        />
                      </label>
                    </div>
                  </div>
                {:else}
                  <p class="mt-2 text-sm font-semibold text-base-content">{formatTimeline()}</p>
                {/if}
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
                {#if isEditing}
                  <div class="mt-3">
                    <LocationAutocomplete
                      label="Location"
                      bind:location={planLocation}
                      bind:country={planCountry}
                      bind:state={planState}
                      bind:city={planCity}
                      singleInput={true}
                      idPrefix="plan-edit-location"
                    />
                  </div>
                {:else}
                  <p class="mt-2 text-sm font-semibold text-base-content">{planLocation}</p>
                {/if}
              </div>
            </div>
          </div>
        </div>
        {#if !venmoHandle}
          <div class="alert alert-warning">
            <span>
              Add your handle to enable participant payouts.
              <a class="link link-hover ml-1" href="/profile">Update profile</a>
            </span>
          </div>
        {/if}
        <PlanStats
          budget={confirmedTotalCost}
          collected={props.data.plan.raised}
          perPerson={userTotalCost}
          countdown={formatCountdown(planStartDate)}
        />

        <div class="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <div class="space-y-6">
            <ItineraryTimeline
              activities={activities}
              planStatus={props.data.plan.status}
              addTargetId="add-activity-modal"
              emphasizeAdd={true}
              bind:this={itineraryTimeline}
              on:activityUpdate={handleActivityUpdate}
            />
          </div>
          <div class="space-y-6">
            <ParticipantsCard
              participants={participantsWithHost}
              manageTargetId="manage-participants-modal"
            />
            <ChatPanel messages={props.data.plan.chat} />
          </div>
        </div>

        <ProposedActivities
          activities={rejectedActivities}
          profileId={hostId}
          onSelect={(activity) => {
            if (hostId && activity.proposerId === hostId) {
              openRejectedActivity(activity);
            }
          }}
          showScrollControls={true}
        />
      {/if}
    </section>

    <input id="manage-participants-modal" type="checkbox" class="modal-toggle" />
    <div class="modal" role="dialog">
      <div class="modal-box">
        <h3 class="text-lg font-semibold mb-4">Manage Participants</h3>
        <div class="space-y-3">
          {#if props.data.plan}
            {#each participantsWithHost as person}
            <div class="flex items-center justify-between rounded-2xl border border-base-200 p-3">
              <div class="flex items-center gap-3">
                <Avatar
                  initials={person.name.slice(0, 1)}
                  status="none"
                  imageUrl={person.avatar ?? null}
                />
                <div>
                  <p class="font-semibold text-sm">{person.name}</p>
                  {#if person.status === 'organizer'}
                    <span class="badge badge-success badge-xs">Organizer</span>
                  {:else}
                    <p class="text-xs text-base-content/60">{person.status ?? 'participant'}</p>
                  {/if}
                </div>
              </div>
              {#if person.status !== 'organizer'}
                <label class="btn btn-xs btn-outline text-error" for="remove-participant-modal">
                  Remove
                </label>
              {/if}
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

    <AddActivityModal
      planId={props.data.plan?.id ?? null}
      modalId="add-activity-modal"
      bind:open={addActivityOpen}
      on:activityCreated={handleActivityCreated}
    />

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

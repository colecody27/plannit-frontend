<script lang="ts">
  import AppNav from '$lib/components/AppNav.svelte';
  import PlanHeader from '$lib/components/PlanHeader.svelte';
  import PlanStats from '$lib/components/PlanStats.svelte';
  import Avatar from '$lib/components/Avatar.svelte';
  import ChatPanel from '$lib/components/ChatPanel.svelte';
  import ItineraryTimeline from '$lib/components/ItineraryTimeline.svelte';
  import ParticipantsCard from '$lib/components/ParticipantsCard.svelte';
  import AddActivityModal from '$lib/components/AddActivityModal.svelte';
  import { formatShortDate } from '$lib/models/plan';
  import { page } from '$app/stores';

  const props = $props();
  const plan = props.data.plan;
  const statusMessage = props.data.statusMessage ?? '';
  const planLocked = (plan?.status ?? '').toLowerCase() === 'locked';
  let copiedVenmo = false;
  let addActivityOpen = false;

  const host =
    plan?.organizer ??
    plan?.participants.find((person) => person.status === 'organizer') ??
    plan?.participants[0] ??
    null;
  const hostInitials = host?.name
    ? host.name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('')
    : 'H';

  let activities = $state(plan?.activities ?? []);

  $effect(() => {
    activities = plan?.activities ?? [];
  });

  const handleActivityUpdate = (event: CustomEvent<import('$lib/types').Activity>) => {
    const updated = event.detail;
    activities = activities.map((activity) =>
      activity.id === updated.id ? updated : activity
    );
  };

  const userTotalCost = $derived.by(() => {
    const profileId = $page.data?.profile?.id;
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

  const venmoHandle = plan?.organizer?.venmo ?? null;
  const venmoLink = venmoHandle ? `https://venmo.com/u/${venmoHandle}` : null;

  const formatTimeline = (start?: Date | null, end?: Date | null) => {
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

  const copyVenmoHandle = async () => {
    try {
      await navigator.clipboard.writeText(venmoHandle);
    } catch (error) {
      // Fallback to still show feedback even if clipboard is blocked.
    }
    copiedVenmo = true;
    setTimeout(() => {
      copiedVenmo = false;
    }, 2000);
  };
</script>

<div>
  <AppNav />
  <main class="px-6 lg:px-16 pb-20">
    <section class="section-spacing space-y-8">
      {#if statusMessage}
        <div class="alert alert-info text-sm">{statusMessage}</div>
      {:else if plan}
        <PlanHeader
          title={plan.title}
          dateRange={formatTimeline(plan.startDay ?? null, plan.endDay ?? null)}
          location={plan.location}
          showFinalize={false}
          showInvite={false}
          extraActionLabel="Leave Plan"
          extraActionHref="#"
          extraActionVariant="ghost"
          extraActionClass="text-error"
          extraActionTargetId="leave-plan-modal"
        />
        <div class="card bg-base-100 border border-base-200 shadow-sm">
          <div class="card-body">
            <div class="overflow-hidden rounded-2xl border border-base-200">
              <img
                class="h-48 w-full object-cover"
                src={plan.coverImage}
                alt={plan.title}
              />
            </div>
            <div class="mt-4 flex items-center gap-3">
              <Avatar
                initials={hostInitials}
                size="lg"
                status="none"
                imageUrl={plan.organizer?.picture ?? undefined}
                innerClass="bg-primary/15 text-primary"
              />
              <div class="text-sm">
                <p class="text-base-content/60">Hosted by</p>
                <p class="font-semibold">{host?.name ?? 'Plan Organizer'}</p>
              </div>
            </div>
            <h3 class="text-lg font-semibold mt-4">Plan Details</h3>
            <p class="text-sm text-base-content/70">{plan.description}</p>
          </div>
        </div>
        {#if planLocked}
          <div class="card bg-base-100 border border-base-200 shadow-sm">
            <div class="card-body flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h3 class="text-lg font-semibold">Plan locked - payment required</h3>
                <p class="text-sm text-base-content/60">Complete your buy-in to confirm your spot.</p>
              </div>
              <label class="btn btn-primary" for="payment-modal">Pay Now</label>
            </div>
          </div>
        {/if}
        <PlanStats
          budget={confirmedTotalCost}
          collected={plan.raised}
          perPerson={userTotalCost}
          countdown={formatCountdown(plan.startDay ?? null)}
        />

        <div class="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <div class="space-y-6">
            <ItineraryTimeline
              activities={activities}
              addTargetId="add-activity-modal"
              emphasizeAdd={true}
              on:activityUpdate={handleActivityUpdate}
            />
          </div>
          <div class="space-y-6">
            <ParticipantsCard participants={plan.participants} showManage={false} />
            <ChatPanel messages={plan.chat} />
          </div>
        </div>
      {/if}
    </section>

    <input id="payment-modal" type="checkbox" class="modal-toggle" />
    <div class="modal" role="dialog">
      <div class="modal-box">
        <h3 class="text-lg font-semibold mb-4">Payment Details</h3>
        <div class="space-y-3">
          <div class="rounded-2xl border border-base-200 p-4">
            <p class="text-sm text-base-content/60">Organizer</p>
            <p class="font-semibold">{host?.name ?? 'Plan Organizer'}</p>
            {#if venmoHandle}
              <p class="text-sm text-base-content/60">Venmo: {venmoHandle}</p>
              {#if venmoLink}
                <p class="text-sm text-base-content/60">
                  Link:
                  <a class="link link-hover text-primary" href={venmoLink} target="_blank" rel="noreferrer">
                    {venmoLink}
                  </a>
                </p>
              {/if}
              <button class="btn btn-xs btn-outline mt-3" on:click={copyVenmoHandle}>
                {copiedVenmo ? 'Handle copied' : 'Copy Venmo handle'}
              </button>
            {:else}
              <p class="text-sm text-base-content/60">Venmo handle not available.</p>
            {/if}
          </div>
          <div class="rounded-2xl border border-base-200 p-4">
            <p class="text-sm text-base-content/60">Amount due</p>
            <p class="text-2xl font-semibold">
              ${plan?.perPerson?.toFixed(2) ?? '0.00'}
            </p>
          </div>
        </div>
        <div class="modal-action">
          <label for="payment-modal" class="btn btn-outline">Close</label>
          <label for="payment-modal" class="btn btn-primary">Mark as Paid</label>
        </div>
      </div>
      <label class="modal-backdrop" for="payment-modal">Close</label>
    </div>

    <input id="leave-plan-modal" type="checkbox" class="modal-toggle" />
    <div class="modal" role="dialog">
      <div class="modal-box">
        <h3 class="text-lg font-semibold mb-3 text-error">Leave this plan?</h3>
        <p class="text-sm text-base-content/70">
          You will lose access to the itinerary and chat unless you are re-invited.
        </p>
        <div class="modal-action">
          <label for="leave-plan-modal" class="btn btn-ghost">Cancel</label>
          <button class="btn btn-error">Leave Plan</button>
        </div>
      </div>
      <label class="modal-backdrop" for="leave-plan-modal">Close</label>
    </div>

    <AddActivityModal
      planId={plan?.id ?? null}
      modalId="add-activity-modal"
      bind:open={addActivityOpen}
    />
  </main>
</div>

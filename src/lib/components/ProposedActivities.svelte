<script lang="ts">
  import type { Activity } from '$lib/types';

  export let activities: Activity[] = [];
  export let title = 'Proposed Activities';
  export let profileId: string | null = null;
  export let onSelect: ((activity: Activity) => void) | null = null;
  export let showScrollControls = false;
  export let scrollContainer: HTMLDivElement | null = null;

  const handleSelect = (activity: Activity) => {
    if (onSelect) {
      onSelect(activity);
    }
  };

  const scrollBy = (direction: 'prev' | 'next') => {
    if (!scrollContainer) {
      return;
    }
    const offset = direction === 'next' ? 320 : -320;
    scrollContainer.scrollBy({ left: offset, behavior: 'smooth' });
  };
</script>

{#if activities.length}
  <section class="space-y-4">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span class="text-xs uppercase tracking-wide text-base-content/50">Rejected</span>
        <h3 class="text-lg font-semibold">{title}</h3>
      </div>
      {#if showScrollControls}
        <div class="flex items-center gap-2">
          <button
            class="btn btn-ghost btn-sm"
            type="button"
            aria-label="Scroll left"
            on:click={() => scrollBy('prev')}
          >
            ‹
          </button>
          <button
            class="btn btn-ghost btn-sm"
            type="button"
            aria-label="Scroll right"
            on:click={() => scrollBy('next')}
          >
            ›
          </button>
        </div>
      {/if}
    </div>
    <div class="flex gap-4 overflow-x-auto pb-4 pr-2" bind:this={scrollContainer}>
      {#each activities as activity}
        {@const proposerLabel =
          activity.proposerId && profileId && activity.proposerId === profileId
            ? 'You'
            : activity.proposerName ?? 'Guest'}
        <div
          class={`card w-64 shrink-0 bg-base-100 border border-base-200 shadow-sm ${
            onSelect ? 'cursor-pointer' : ''
          }`}
          role={onSelect ? 'button' : undefined}
          tabindex={onSelect ? 0 : undefined}
          on:click={() => handleSelect(activity)}
          on:keydown={(event) => {
            if (!onSelect || (event.key !== 'Enter' && event.key !== ' ')) {
              return;
            }
            event.preventDefault();
            handleSelect(activity);
          }}
        >
          <div class="h-24 w-full overflow-hidden rounded-t-2xl bg-base-200">
            <img
              class="h-full w-full object-cover"
              src={activity.image ??
                'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80'}
              alt={activity.title}
            />
          </div>
          <div class="card-body gap-3">
            <div>
              <p class="font-semibold">{activity.title}</p>
              <p class="text-xs text-base-content/60">{activity.location}</p>
            </div>
            <div class="text-xs text-base-content/60">Proposed by {proposerLabel}</div>
          </div>
        </div>
      {/each}
    </div>
  </section>
{/if}

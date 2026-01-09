<script lang="ts">
  export let initials = '';
  export let size: 'sm' | 'md' | 'lg' | 'xl' = 'md';
  export let status: 'online' | 'offline' | 'none' = 'online';
  export let imageUrl: string | null = null;
  export let outerClass = '';
  export let innerClass = '';
  export let textClass = '';

  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-9 w-9 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-20 w-20 text-xl'
  } as const;

  $: statusClass =
    status === 'online' ? 'avatar-online' : status === 'offline' ? 'avatar-offline' : '';
  let resolvedImage: string | null = null;
  let isLoading = false;
  let imgEl: HTMLImageElement | null = null;

  $: resolvedImage = imageUrl && imageUrl.trim() ? imageUrl : null;
  $: if (resolvedImage) {
    isLoading = true;
  } else {
    isLoading = false;
  }

  $: if (resolvedImage && imgEl?.complete) {
    isLoading = false;
  }

  const handleImageError = () => {
    resolvedImage = null;
    isLoading = false;
  };

  const handleImageLoad = () => {
    isLoading = false;
  };
</script>

<div class={`avatar placeholder overflow-visible ${statusClass} ${outerClass}`.trim()}>
  <div
    class={`rounded-full flex items-center justify-center leading-none ${sizeClasses[size]} bg-base-200 text-base-content ${innerClass} ${textClass}`.trim()}
  >
    {#if resolvedImage}
      <div class={`relative h-full w-full rounded-full ${isLoading ? 'animate-pulse' : ''}`.trim()}>
        {#if isLoading}
          <div class="absolute inset-0 rounded-full bg-base-300"></div>
        {/if}
        <img
          class="h-full w-full rounded-full object-cover"
          src={resolvedImage}
          alt="Profile avatar"
          referrerpolicy="no-referrer"
          bind:this={imgEl}
          on:load={handleImageLoad}
          on:error={handleImageError}
        />
      </div>
    {:else}
      <span>{initials}</span>
    {/if}
  </div>
</div>

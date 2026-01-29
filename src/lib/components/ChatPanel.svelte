<script lang="ts">
  import type { ChatMessage } from '$lib/types';
  import { formatTime } from '$lib/models/plan';
  import { createEventDispatcher, tick } from 'svelte';

  const props = $props<{ messages?: ChatMessage[]; activeUsers?: number | null }>();
  const messages = $derived(props.messages ?? []);
  const activeUsers = $derived(props.activeUsers ?? null);

  const dispatch = createEventDispatcher<{ send: string }>();
  let draft = $state('');
  let scrollContainer: HTMLDivElement | null = null;

  $effect(async () => {
    messages;
    await tick();
    if (scrollContainer) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  });

  const handleSend = () => {
    const text = draft.trim();
    if (!text) {
      return;
    }
    console.log('ChatPanel: sending message', text);
    dispatch('send', text);
    draft = '';
  };
</script>

<div class="card plan-glass shadow-sm">
  <div class="card-body gap-4">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2 text-primary">
        <span class="material-symbols-outlined text-lg">forum</span>
        <h3 class="text-sm font-semibold uppercase tracking-widest">Group Chat</h3>
      </div>
      <span class="text-xs text-primary/70">
        {activeUsers !== null ? `${activeUsers} online` : 'Online'}
      </span>
    </div>
    <div class="space-y-4 max-h-72 overflow-auto" bind:this={scrollContainer}>
      {#each messages as message}
        {#if message.senderId === 'system'}
          <div class="text-xs text-base-content/60 text-center">
            {message.message} - {formatTime(message.timestamp)}
          </div>
        {:else}
          <div class={`chat ${message.isSelf ? 'chat-end' : 'chat-start'}`}>
            <div class="chat-header text-xs text-base-content/60">
              {message.isSelf ? 'You' : message.name} - {formatTime(message.timestamp)}
            </div>
            <div class={`chat-bubble ${message.isSelf ? 'chat-bubble-primary text-primary-content' : ''}`}>
              {message.message}
            </div>
          </div>
        {/if}
      {/each}
    </div>
    <div class="flex items-center gap-2">
      <input
        class="input input-bordered flex-1"
        placeholder="Type a message..."
        bind:value={draft}
        on:keydown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            handleSend();
          }
        }}
      />
      <button class="btn btn-primary btn-square" type="button" on:click={handleSend} aria-label="Send message">
        <span class="material-symbols-outlined text-xl">send</span>
      </button>
    </div>
  </div>
</div>

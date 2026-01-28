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

<div class="card bg-base-100 border border-base-200 shadow-sm">
  <div class="card-body gap-4">
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold">Group Chat</h3>
      <span class="text-xs text-success">
        {activeUsers !== null ? `${activeUsers} online` : 'Online'}
      </span>
    </div>
    <div class="space-y-4 max-h-72 overflow-auto" bind:this={scrollContainer}>
      {#each messages as message}
        <div class={`chat ${message.isSelf ? 'chat-end' : 'chat-start'}`}>
          <div class="chat-header text-xs text-base-content/60">
            {message.isSelf ? 'You' : message.name} - {formatTime(message.timestamp)}
          </div>
          <div class={`chat-bubble ${message.isSelf ? 'chat-bubble-primary text-primary-content' : ''}`}>
            {message.message}
          </div>
        </div>
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
      <button class="btn btn-primary btn-square" type="button" on:click={handleSend}>-></button>
    </div>
  </div>
</div>

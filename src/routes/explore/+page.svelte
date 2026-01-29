<script lang="ts">
  import AppNav from '$lib/components/AppNav.svelte';
</script>

<div>
  <AppNav />
  <main class="px-6 lg:px-16 pb-20">
    <section class="section-spacing mx-auto max-w-3xl space-y-4 text-center">
      <h1 class="text-3xl font-semibold">Explore plans</h1>
      <p class="text-base text-base-content/70">
        Discovery experiences will live here. Soon you will be able to browse public trips and join
        shared adventures.
      </p>
      <label class="btn btn-primary" for="public-plans-modal">Browse public plans</label>
    </section>

    <input id="public-plans-modal" type="checkbox" class="modal-toggle" />
    <div class="modal" role="dialog">
      <div class="modal-box">
        <h3 class="text-lg font-semibold mb-2">Feature unavailable</h3>
        <p class="text-sm text-base-content/70">
          Browsing public plans isn’t available yet.
        </p>
        <div class="modal-action">
          <label for="public-plans-modal" class="btn btn-primary">Okay</label>
        </div>
      </div>
      <label class="modal-backdrop" for="public-plans-modal">Close</label>
    </div>
  </main>
</div>

<script lang="ts">
  import { onMount } from 'svelte';

  export let budget = 2400;
  export let collected = 1200;
  export let perPerson = 200;
  export let countdown = '12 Days';

  $: progressValue = budget > 0 ? (collected / budget) * 100 : 0;

  onMount(() => {
    const root = document.querySelector('.stats-carousel-root');
    const carousel = root?.querySelector('.carousel');
    const dots = root?.querySelectorAll<HTMLButtonElement>('[data-target]');
    if (!root || !carousel || !dots?.length) {
      return;
    }

    const items = root.querySelectorAll<HTMLElement>('.carousel-snap');
    const setActive = (index: number) => {
      dots.forEach((dot, i) => {
        dot.classList.toggle('bg-primary', i === index);
        dot.classList.toggle('bg-base-300', i !== index);
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) {
          return;
        }
        const index = Array.from(items).indexOf(visible.target as HTMLElement);
        if (index >= 0) {
          setActive(index);
        }
      },
      { root: carousel, threshold: [0.6] }
    );

    items.forEach((item) => observer.observe(item));
    setActive(0);

    dots.forEach((dot, index) => {
      dot.addEventListener('click', () => {
        items[index]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      });
    });
  });
</script>

<div class="card bg-base-100 border border-base-200 shadow-sm stats-carousel-root">
  <div class="card-body py-4">
    <div class="carousel w-full lg:grid lg:grid-cols-4 lg:gap-3">
      <div id="stat-1" class="carousel-item w-full lg:w-auto justify-center carousel-snap">
        <div class="w-full lg:text-left text-center pb-0.5">
          <p class="text-xs uppercase tracking-wide text-base-content/50">Total Cost</p>
          <p class="text-2xl font-semibold">${budget.toLocaleString()}</p>
        </div>
      </div>
      <div id="stat-2" class="carousel-item w-full lg:w-auto justify-center carousel-snap">
        <div class="w-full lg:text-left text-center pb-0.5">
          <p class="text-xs uppercase tracking-wide text-base-content/50">Your total</p>
          <p class="text-2xl font-semibold">${perPerson.toLocaleString()}</p>
        </div>
      </div>
      <div id="stat-3" class="carousel-item w-full lg:w-auto justify-center carousel-snap">
        <div class="w-full lg:text-left text-center pb-0.5">
          <p class="text-xs uppercase tracking-wide text-base-content/50">Collected</p>
          <p class="text-2xl font-semibold text-primary">${collected.toLocaleString()}</p>
          <progress class="progress progress-primary" value={progressValue} max="100"></progress>
        </div>
      </div>
      <div id="stat-4" class="carousel-item w-full lg:w-auto justify-center carousel-snap">
        <div class="w-full lg:text-left text-center pb-0.5">
          <p class="text-xs uppercase tracking-wide text-base-content/50">Countdown</p>
          <p class="text-2xl font-semibold">{countdown}</p>
          <p class="text-xs text-base-content/60">Until trip starts</p>
        </div>
      </div>
    </div>
    <div class="flex justify-center gap-2 pt-1 lg:hidden">
      <button class="h-2 w-2 rounded-full bg-base-300" type="button" data-target="stat-1"></button>
      <button class="h-2 w-2 rounded-full bg-base-300" type="button" data-target="stat-2"></button>
      <button class="h-2 w-2 rounded-full bg-base-300" type="button" data-target="stat-3"></button>
      <button class="h-2 w-2 rounded-full bg-base-300" type="button" data-target="stat-4"></button>
    </div>
  </div>
</div>

<style>
  :global(.stats-carousel-root .carousel) {
    scroll-snap-type: x mandatory;
  }
  :global(.stats-carousel-root .carousel-snap) {
    scroll-snap-align: center;
  }
</style>

<script lang="ts">
  import { onDestroy } from 'svelte';

  export let open = false;
  export let onClose: (() => void) | null = null;

  let container: HTMLDivElement | null = null;
  let animation: { destroy: () => void } | null = null;
  let showFallback = true;

  const animationData = {
    v: '5.7.4',
    fr: 60,
    ip: 0,
    op: 60,
    w: 200,
    h: 200,
    nm: 'check_only',
    ddd: 0,
    assets: [],
    layers: [
      {
        ddd: 0,
        ind: 1,
        ty: 4,
        nm: 'check',
        sr: 1,
        ks: {
          o: { a: 0, k: 100 },
          r: { a: 0, k: 0 },
          p: { a: 0, k: [100, 100, 0] },
          a: { a: 0, k: [0, 0, 0] },
          s: { a: 0, k: [100, 100, 100] }
        },
        shapes: [
          {
            ty: 'gr',
            it: [
              {
                ty: 'sh',
                ks: {
                  a: 0,
                  k: {
                    i: [[0, 0], [0, 0], [0, 0]],
                    o: [[0, 0], [0, 0], [0, 0]],
                    v: [[-40, 5], [-10, 35], [45, -25]],
                    c: false
                  }
                }
              },
              {
                ty: 'st',
                c: { a: 0, k: [0.1, 0.7, 0.4, 1] },
                o: { a: 0, k: 100 },
                w: { a: 0, k: 12 },
                lc: 2,
                lj: 2,
                ml: 4
              },
              {
                ty: 'tr',
                p: { a: 0, k: [0, 0] },
                a: { a: 0, k: [0, 0] },
                s: { a: 0, k: [100, 100] },
                r: { a: 0, k: 0 },
                o: { a: 0, k: 100 }
              }
            ]
          }
        ],
        ao: 0,
        ip: 0,
        op: 60,
        st: 0,
        bm: 0
      }
    ]
  };

  $: if (open && container && !animation && !showFallback) {
    // Reserved for future Lottie JSON usage.
  }

  $: if (!open && animation) {
    animation.destroy();
    animation = null;
    showFallback = true;
  }

  onDestroy(() => {
    animation?.destroy();
  });
</script>

{#if open}
  <div class="modal modal-open payment-success-modal" role="dialog" aria-modal="true" style="z-index: 1100;">
    <div class="modal-box text-center payment-success-box">
      <div class="mx-auto h-32 w-32">
        <svg class="payment-check" viewBox="0 0 120 120" aria-hidden="true">
          <circle class="payment-check__circle" cx="60" cy="60" r="46" />
          <path class="payment-check__mark" d="M35 62l16 16 34-34" />
        </svg>
      </div>
    </div>
  </div>
{/if}

<style>
  .payment-check {
    width: 100%;
    height: 100%;
  }

  .payment-check__circle {
    fill: none;
    stroke: rgba(23, 230, 142, 0.2);
    stroke-width: 8;
    stroke-linecap: round;
    stroke-dasharray: 290;
    stroke-dashoffset: 290;
    animation: circle-draw 0.6s ease forwards;
  }

  .payment-check__mark {
    fill: none;
    stroke: rgb(23, 230, 142);
    stroke-width: 8;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-dasharray: 80;
    stroke-dashoffset: 80;
    animation: check-draw 0.5s ease 0.4s forwards;
  }

  @keyframes circle-draw {
    to {
      stroke-dashoffset: 0;
    }
  }

  @keyframes check-draw {
    to {
      stroke-dashoffset: 0;
    }
  }

  :global(.payment-success-modal) {
    background-color: rgba(0, 0, 0, 0.08) !important;
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
  }

  :global(.payment-success-modal::backdrop) {
    background-color: rgba(0, 0, 0, 0.08) !important;
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
  }

  :global(.payment-success-box) {
    background-color: transparent !important;
    box-shadow: none !important;
  }
</style>

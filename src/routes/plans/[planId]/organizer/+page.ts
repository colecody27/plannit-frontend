import type { PageLoad } from './$types';
import type { ApiPlan, ApiResponse } from '$lib/api/types';
import type { PlanDetail } from '$lib/types';
import { mapPlanDetailFromApi } from '$lib/models/plan';

export const load: PageLoad = async ({ fetch, params }) => {
  const { planId } = params;
  let plan: PlanDetail | null = null;
  let statusMessage = '';

  try {
    const response = await fetch(`/api/plan/${planId}`);
    if (!response.ok) {
      throw new Error('Unable to load plan.');
    }

    const payload = (await response.json()) as ApiResponse<ApiPlan>;
    if (payload.success && payload.data) {
      plan = mapPlanDetailFromApi(payload.data);
    } else {
      statusMessage = 'Plan not available.';
    }
  } catch (error) {
    statusMessage = 'Unable to load plan right now.';
  }

  return { plan, statusMessage };
};

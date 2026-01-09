import type { LayoutLoad } from './$types';
import type { ApiResponse, ApiUserProfile } from '$lib/api/types';
import type { UserProfile } from '$lib/types';
import { mapUserProfileFromApi } from '$lib/models/user';

const PROFILE_PATH = '/api/user';

export const load: LayoutLoad = async ({ fetch }) => {
  let profile: UserProfile | null = null;

  try {
    const response = await fetch(PROFILE_PATH);
    if (response.ok) {
      const payload = (await response.json()) as ApiResponse<ApiUserProfile>;
      if (payload?.success && payload.data) {
        profile = mapUserProfileFromApi(payload.data);
      }
    }
  } catch (error) {
    profile = null;
  }

  return { profile };
};

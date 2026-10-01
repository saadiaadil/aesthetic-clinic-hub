import { USE_MOCK_API } from '@/constants/config';
import { ASSISTANT_MATCHES } from '@/data/recommendations';
import { http, mockRequest } from './apiClient';
import { db } from './mock/mockDb';
import { isPublicClinic } from './mock/selectors';

/**
 * Discovery assistant ("Not sure where to start?"). Rule-based today; the
 * Phase 2 AI recommendation engine will sit behind the same endpoint.
 * REST endpoint (Phase 5): GET /recommendations?area=&goal=
 */
export function getRecommendation({ area, goal }) {
  if (!USE_MOCK_API) return http('/recommendations', { params: { area, goal } });
  return mockRequest(
    () => {
      const match = ASSISTANT_MATCHES[`${area}-${goal}`] ?? ASSISTANT_MATCHES['skin-prevent'];
      const offers = db
        .where('clinicServices', (service) => service.treatmentId === match.treatmentId && service.isAvailable)
        .filter((service) => isPublicClinic(db.find('clinics', service.clinicId)));
      const specialistCount = new Set(offers.flatMap((service) => service.doctorIds)).size;
      return {
        ...match,
        specialistCount,
        clinicCount: new Set(offers.map((service) => service.clinicId)).size,
        priceFrom: offers.length ? Math.min(...offers.map((service) => service.priceMin)) : null,
      };
    },
    { delay: 180 },
  );
}

/** Riyadh districts used across search, filters, registration and clinic onboarding. */
export const DISTRICTS = [
  { id: 'olaya', name: 'Al Olaya', label: 'Al Olaya (Medical Core)' },
  { id: 'hittin', name: 'Hittin', label: 'Hittin & Boulevard' },
  { id: 'nakheel', name: 'Al Nakheel', label: 'Al Nakheel North' },
  { id: 'malqa', name: 'Al Malqa', label: 'Al Malqa (North Riyadh)' },
  { id: 'dq', name: 'Diplomatic Quarter', label: 'Diplomatic Quarter (DQ)' },
  { id: 'wurud', name: 'Al Wurud', label: 'Al Wurud' },
  { id: 'sulaimaniyah', name: 'Al Sulaimaniyah', label: 'Al Sulaimaniyah' },
  { id: 'yasmin', name: 'Al Yasmin', label: 'Al Yasmin' },
];

export const ALL_DISTRICTS = 'all';

export const getDistrict = (id) => DISTRICTS.find((district) => district.id === id);

export const getDistrictName = (id) => getDistrict(id)?.name ?? 'Riyadh';

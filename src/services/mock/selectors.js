import { getDistrictName } from '@/constants/districts';
import { LANGUAGE_LABELS } from '@/data/doctors';
import { addDays, dayOfWeek, fromScheduledAt, todayKey } from '@/utils/date';
import { getMergedSlots } from './availability';
import { db } from './mockDb';

/**
 * Mock "joins" — shape raw table rows into the view models the REST API will
 * return (the equivalent of Mongoose `populate` + projection).
 */

export const isPublicClinic = (clinic) => clinic?.verificationStatus === 'verified';

export function getTreatment(id) {
  return db.find('treatments', id);
}

export function getSpecialty(id) {
  return db.find('specialties', id);
}

export function publicUser(user) {
  if (!user) return null;
  // Never expose credentials (mock-only field).
  const { password: _password, ...safe } = user;
  return safe;
}

export function clinicServiceView(service) {
  const treatment = getTreatment(service.treatmentId);
  return {
    ...service,
    treatment: treatment
      ? { id: treatment.id, name: treatment.name, specialtyId: treatment.specialtyId, category: treatment.category, image: treatment.image }
      : null,
  };
}

export function doctorSummary(doctor) {
  if (!doctor) return null;
  const clinic = db.find('clinics', doctor.primaryClinicId);
  return {
    id: doctor.id,
    name: doctor.name,
    title: doctor.title,
    headline: doctor.headline,
    specialization: doctor.specialization,
    gender: doctor.gender,
    photo: doctor.photo,
    headshot: doctor.headshot ?? doctor.photo,
    rating: doctor.rating,
    reviewCount: doctor.reviewCount,
    consultationFee: doctor.consultationFee,
    experienceYears: doctor.experienceYears,
    languages: doctor.languages,
    languageLabels: doctor.languages.map((code) => LANGUAGE_LABELS[code] ?? code),
    badges: doctor.badges,
    tags: doctor.tags,
    bio: doctor.bio,
    status: doctor.status,
    primaryClinicId: doctor.primaryClinicId,
    clinic: clinic ? { id: clinic.id, name: clinic.name, districtLabel: clinic.districtLabel } : null,
  };
}

/** Next available slot for a clinic within the coming week (for "Next: Today, 4:30 PM"). */
export function getNextAvailable(clinicId, doctorIds) {
  const ids = doctorIds ?? db.where('doctors', (doc) => doc.clinicIds.includes(clinicId) && doc.status === 'active').map((doc) => doc.id);
  if (ids.length === 0) return null;
  const today = todayKey();
  for (let offset = 0; offset < 10; offset += 1) {
    const dateKey = addDays(today, offset);
    const slot = getMergedSlots({ clinicId, doctorIds: ids, dateKey, durationMinutes: 45 }).find((item) => item.status === 'available');
    if (slot) return { dateKey, slot: slot.slot, dayOffset: offset };
  }
  return null;
}

export function clinicSummary(clinic, { withNextSlot = true } = {}) {
  const services = db.where('clinicServices', (service) => service.clinicId === clinic.id && service.isAvailable);
  const doctors = db.where('doctors', (doc) => doc.clinicIds.includes(clinic.id) && doc.status === 'active');
  return {
    id: clinic.id,
    name: clinic.name,
    category: clinic.category,
    shortDescription: clinic.shortDescription,
    districtId: clinic.districtId,
    districtLabel: clinic.districtLabel,
    address: clinic.address,
    latitude: clinic.latitude,
    longitude: clinic.longitude,
    licenseNumber: clinic.licenseNumber,
    verificationStatus: clinic.verificationStatus,
    rating: clinic.rating,
    reviewCount: clinic.reviewCount,
    teamSize: clinic.teamSize,
    teamLabel: clinic.teamLabel,
    startingPrice: clinic.startingPrice,
    highlightBadge: clinic.highlightBadge,
    signatureTreatments: clinic.signatureTreatments,
    tags: clinic.tags,
    features: clinic.features,
    amenities: clinic.amenities,
    coverImage: clinic.coverImage,
    featuredImage: clinic.featuredImage,
    openingHours: clinic.openingHours,
    specialtyIds: [...new Set(services.map((service) => getTreatment(service.treatmentId)?.specialtyId).filter(Boolean))],
    treatmentIds: [...new Set(services.map((service) => service.treatmentId))],
    serviceCount: services.length,
    doctorCount: doctors.length,
    lowestServicePrice: services.length ? Math.min(...services.map((service) => service.priceMin)) : null,
    nextAvailable: withNextSlot ? getNextAvailable(clinic.id, doctors.map((doc) => doc.id)) : null,
    createdAt: clinic.createdAt,
  };
}

export function reviewView(review) {
  const user = db.find('users', review.userId);
  const doctor = review.doctorId ? db.find('doctors', review.doctorId) : null;
  const clinic = db.find('clinics', review.clinicId);
  const districtName = user?.district ? getDistrictName(user.district) : null;
  return {
    ...review,
    author: {
      id: user?.id,
      name: user?.name ?? 'Verified Patient',
      avatar: user?.avatar ?? null,
      district: districtName,
    },
    doctor: doctor ? { id: doctor.id, name: doctor.name } : null,
    clinic: clinic ? { id: clinic.id, name: clinic.name, districtLabel: clinic.districtLabel } : null,
  };
}

export function appointmentView(appointment) {
  const clinic = db.find('clinics', appointment.clinicId);
  const doctor = db.find('doctors', appointment.doctorId);
  const user = db.find('users', appointment.userId);
  const service = db.find('clinicServices', appointment.clinicServiceId);
  const treatment = getTreatment(appointment.treatmentId);
  const review = db.all('reviews').find((item) => item.appointmentId === appointment.id) ?? null;
  const { dateKey, slot } = fromScheduledAt(appointment.scheduledAt);
  return {
    ...appointment,
    dateKey,
    slot,
    dayOfWeek: dayOfWeek(dateKey),
    clinic: clinic
      ? { id: clinic.id, name: clinic.name, districtLabel: clinic.districtLabel, address: clinic.address, contactNo: clinic.contactNo, coverImage: clinic.coverImage, licenseNumber: clinic.licenseNumber, latitude: clinic.latitude, longitude: clinic.longitude }
      : null,
    doctor: doctor ? { id: doctor.id, name: doctor.name, title: doctor.title, headline: doctor.headline, headshot: doctor.headshot ?? doctor.photo, rating: doctor.rating, reviewCount: doctor.reviewCount, badges: doctor.badges } : null,
    patient: user ? { id: user.id, name: user.name, avatar: user.avatar, phone: user.phone, email: user.email, tier: user.tier ?? null, fileNo: user.fileNo ?? null } : null,
    service: service ? { id: service.id, title: service.title, shortTitle: service.shortTitle, description: service.description, priceNote: service.priceNote } : null,
    treatment: treatment ? { id: treatment.id, name: treatment.name, specialtyId: treatment.specialtyId, image: treatment.image } : null,
    review: review ? { id: review.id, rating: review.rating, status: review.status } : null,
  };
}

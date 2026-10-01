/**
 * Image registry — every photo comes from the Google Stitch export
 * (downloaded locally so the app never depends on expiring remote URLs).
 * Mock data references these imports; with the real API these become
 * S3/R2 URLs stored in clinic_images.url.
 */

// Home
import heroSanctuarySuite from './home/hero-sanctuary-suite.jpg';

// Clinics
import dermaartCover from './clinics/dermaart-cover.jpg';
import dermaartReception from './clinics/dermaart-reception.jpg';
import dermaartLobby from './clinics/dermaart-lobby.jpg';
import dermaartMasterSuite from './clinics/dermaart-master-suite.jpg';
import dermaartVipLounge from './clinics/dermaart-vip-lounge.jpg';
import dermaartLaserLab from './clinics/dermaart-laser-lab.jpg';
import executiveSuite from './clinics/executive-suite.jpg';
import lauraCover from './clinics/laura-cover.jpg';
import lauraInterior from './clinics/laura-interior.jpg';
import lauraReception from './clinics/laura-reception.jpg';
import elysianCover from './clinics/elysian-cover.jpg';
import elysianConsultation from './clinics/elysian-consultation.jpg';
import elysianLounge from './clinics/elysian-lounge.jpg';
import elyseeCover from './clinics/elysee-cover.jpg';
import aureliaCover from './clinics/aurelia-cover.jpg';
import royalGlowCover from './clinics/royal-glow-cover.jpg';
import olayaHubReception from './clinics/olaya-hub-reception.jpg';
import limestoneArchesSuite from './clinics/limestone-arches-suite.jpg';
import newClinicPlaceholder from './clinics/new-clinic-placeholder.svg';

// Treatments
import injectables from './treatments/injectables.jpg';
import injectablesAlt from './treatments/injectables-alt.jpg';
import fillers from './treatments/fillers.jpg';
import fillersAlt from './treatments/fillers-alt.jpg';
import laser from './treatments/laser.jpg';
import laserAlt from './treatments/laser-alt.jpg';
import hydrafacial from './treatments/hydrafacial.jpg';
import hydrafacialAlt from './treatments/hydrafacial-alt.jpg';
import hairRestoration from './treatments/hair-restoration.jpg';
import hairRestorationAlt from './treatments/hair-restoration-alt.jpg';
import bodySculpting from './treatments/body-sculpting.jpg';
import bodySculptingAlt from './treatments/body-sculpting-alt.jpg';

// Doctors
import reemAlSaud from './doctors/reem-al-saud.jpg';
import reemAlSaudHeadshot from './doctors/reem-al-saud-headshot.jpg';
import tariqAlKhatib from './doctors/tariq-al-khatib.jpg';
import tariqAlKhatibHeadshot from './doctors/tariq-al-khatib-headshot.jpg';
import monaAlHusseini from './doctors/mona-al-husseini.jpg';
import monaAlHusseiniHeadshot from './doctors/mona-al-husseini-headshot.jpg';
import noraAlSudairi from './doctors/nora-al-sudairi.jpg';

// Patients (clinic dashboard queue portraits)
import noufAlBader from './patients/nouf-al-bader.jpg';
import reemaAlHarbi from './patients/reema-al-harbi.jpg';
import hessaAlOtaibi from './patients/hessa-al-otaibi.jpg';
import sarahAlGhamdi from './patients/sarah-al-ghamdi.jpg';

// Auth & misc
import providerLoginInterior from './auth/provider-login-interior.jpg';
import registrationSuite from './auth/registration-suite.jpg';
import riyadhMap from './misc/riyadh-map.jpg';
import drReemAvatar from './avatars/dr-reem-avatar.jpg';

export const images = {
  home: { heroSanctuarySuite },
  clinics: {
    dermaartCover,
    dermaartReception,
    dermaartLobby,
    dermaartMasterSuite,
    dermaartVipLounge,
    dermaartLaserLab,
    executiveSuite,
    lauraCover,
    lauraInterior,
    lauraReception,
    elysianCover,
    elysianConsultation,
    elysianLounge,
    elyseeCover,
    aureliaCover,
    royalGlowCover,
    olayaHubReception,
    limestoneArchesSuite,
    newClinicPlaceholder,
  },
  treatments: {
    injectables,
    injectablesAlt,
    fillers,
    fillersAlt,
    laser,
    laserAlt,
    hydrafacial,
    hydrafacialAlt,
    hairRestoration,
    hairRestorationAlt,
    bodySculpting,
    bodySculptingAlt,
  },
  doctors: {
    reemAlSaud,
    reemAlSaudHeadshot,
    tariqAlKhatib,
    tariqAlKhatibHeadshot,
    monaAlHusseini,
    monaAlHusseiniHeadshot,
    noraAlSudairi,
  },
  patients: { noufAlBader, reemaAlHarbi, hessaAlOtaibi, sarahAlGhamdi },
  auth: { providerLoginInterior, registrationSuite, luxuryInterior: dermaartMasterSuite },
  misc: { riyadhMap, drReemAvatar },
};

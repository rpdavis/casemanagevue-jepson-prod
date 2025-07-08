import { ref, computed, watch, reactive, onMounted } from 'vue'
import { doc, setDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, storage } from '@/firebase'
import { getDisplayValue } from '@/utils/studentUtils'
import { useAppSettings } from '@/composables/useAppSettings'

export function useStudentForm(props, emit) {
  const { appSettings, loadAppSettings, loading: appSettingsLoading, error: appSettingsError } = useAppSettings()
  onMounted(loadAppSettings)

  const periods = computed(() => appSettings.value?.periodLabels?.slice(0, appSettings.value?.numPeriods) || ['Per1','Per2','Per3','Per4','Per5','Per6','Per7'])
  const availableClassServices = computed(() => (appSettings.value?.classServices || []).filter(s => s.enabledSubcategories?.length))
  const serviceProviders = computed(() => appSettings.value?.serviceProviders || [])
  const customServiceProviders = computed(() => appSettings.value?.customServiceProviders || [])

  const userRoles = computed(() => {
    let roles = props.users.userRoles || {
      teachers: props.users.teachers || [],
      caseManagers: props.users.caseManagers || [],
      speech: props.users.speech || [],
      ot: props.users.ot || [],
      mh: props.users.mh || []
    }
    if (roles.teachers) roles.teachers = roles.teachers.map(t => ({ ...t, id: String(t.id) }))
    return roles
  })

  const form = reactive({
    ssid: props.student.id || '',
    firstName: getDisplayValue(props.student, 'firstName') || '',
    lastName: getDisplayValue(props.student, 'lastName') || '',
    grade: getDisplayValue(props.student, 'grade') || '7',
    plan: getDisplayValue(props.student, 'plan') || 'IEP',
    reviewDate: getDisplayValue(props.student, 'reviewDate') || '',
    reevalDate: getDisplayValue(props.student, 'reevalDate') || '',
    meetingDate: getDisplayValue(props.student, 'meetingDate') || '',
    caseManagerId: props.student.app?.studentData?.caseManagerId || props.student.caseManagerId || props.student.casemanager_id || '',
    schedule: props.student.app?.schedule?.periods || props.student.aeries?.schedule?.periods || props.student.schedule || {},
    services: (props.student.app?.schedule?.classServices || props.student.services) || [],
    speechId: props.student.app?.providers?.speechId || props.student.speechId || props.student.speech_id || '',
    otId: props.student.app?.providers?.otId || props.student.otId || props.student.ot_id || '',
    mhId: props.student.app?.providers?.mhId || props.student.mhId || props.student.mh_id || '',
    ptId: props.student.app?.providers?.ptId || props.student.ptId || props.student.pt_id || '',
    scId: props.student.app?.providers?.scId || props.student.scId || props.student.sc_id || '',
    trId: props.student.app?.providers?.trId || props.student.trId || props.student.tr_id || '',
    audId: props.student.app?.providers?.audId || props.student.audId || props.student.aud_id || '',
    viId: props.student.app?.providers?.viId || props.student.viId || props.student.vi_id || '',
    atId: props.student.app?.providers?.atId || props.student.atId || props.student.at_id || '',
    dhhId: props.student.app?.providers?.dhhId || props.student.dhhId || props.student.dhh_id || '',
    omId: props.student.app?.providers?.omId || props.student.omId || props.student.om_id || '',
    bisId: props.student.app?.providers?.bisId || props.student.bisId || props.student.bis_id || '',
    hnId: props.student.app?.providers?.hnId || props.student.hnId || props.student.hn_id || '',
    swId: props.student.app?.providers?.swId || props.student.swId || props.student.sw_id || '',
    instruction: getDisplayValue(props.student, 'instruction') || '',
    assessment: getDisplayValue(props.student, 'assessment') || '',
    flag1: props.student.app?.flags?.flag1 || props.student.flag1 || false,
    flag2: props.student.app?.flags?.flag2 || props.student.flag2 || false,
    ataglancePdfUrl: props.student.app?.documents?.ataglancePdfUrl || props.student.ataglancePdfUrl || '',
    bipPdfUrl: props.student.app?.documents?.bipPdfUrl || props.student.bipPdfUrl || '',
    bipFile: null,
    ataglanceFile: null,
    removeBipFile: false,
    removeAtaglanceFile: false
  })

  watch(() => props.student, (newStudent) => {
    // ...same as before, update form fields...
  }, { immediate: true, deep: true })

  const providerFieldMap = {
    SLP: 'speechId', OT: 'otId', MH: 'mhId', PT: 'ptId', SC: 'scId', TR: 'trId', AUD: 'audId', VI: 'viId', AT: 'atId', DHH: 'dhhId', 'O&M': 'omId', BIS: 'bisId', HN: 'hnId', SW: 'swId'
  }
  const getProviderLabel = abbr => abbr // (implement as needed)
  const getProviderUsers = abbr => [] // (implement as needed)

  const isSaving = ref(false)
  function onFileChange(event, key) { form[key] = event.target.files[0] || null }
  function removeBipFile() { form.removeBipFile = true; form.bipFile = null }
  function removeAtaglanceFile() { form.removeAtaglanceFile = true; form.ataglanceFile = null }

  async function handleSubmit() {
    // ...same as before, but use form object...
    // emit('saved', payload); emit('close')
  }

  return {
    form, userRoles, periods, availableClassServices, serviceProviders, customServiceProviders,
    appSettingsLoading, appSettingsError, providerFieldMap, getProviderLabel, getProviderUsers,
    isSaving, handleSubmit, onFileChange, removeBipFile, removeAtaglanceFile
  }
} 
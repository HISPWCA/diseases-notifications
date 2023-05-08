import axios from 'axios'
import React, { useEffect, useState, Fragment } from 'react'
import { DatePicker, Spin, Button, Popconfirm, Radio, Space, InputNumber } from 'antd'
import {
    EuiButton,
    EuiButtonIcon,
    EuiTitle,
    useGeneratedHtmlId,
    EuiFlyout,
    EuiFlyoutBody,
    EuiFlyoutHeader,
    EuiText,
    EuiSelectable,
    EuiTextArea,
    EuiPanel,
    EuiIcon,
    EuiCheckableCard,
    EuiModal,
    EuiSpacer,
    EuiFlexGroup,
    EuiFlexItem,
    EuiFormFieldset,
    EuiFlexGrid,
    EuiCard,
    EuiButtonGroup,
    EuiToolTip,
    EuiTabbedContent,
    EuiTextColor,
    EuiStat,
    EuiBeacon,
    EuiLink,
    EuiFieldText,
    EuiFormControlLayout,
    EuiFieldPassword,
    EuiModalHeader,
    EuiModalHeaderTitle,
    EuiModalFooter,
    EuiModalBody,
    EuiSwitch,
    EuiFormRow,
    EuiPopover,
    EuiContextMenu,
    EuiDatePicker,
    EuiDatePickerRange,
    EuiButtonEmpty,
} from '@elastic/eui'

import { FaRegEdit, FaTrash } from 'react-icons/fa'
import moment from 'moment'
import OrganisationUnitsTree from '../utils/orgUnitsTree'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Pie } from 'react-chartjs-2'
import { API_BASE_ROUTE, TRACKED_ENTITY_INSTANCES_ROUTE } from '../utils/api.routes'
import MapL from './MapL'
import ReactApexChart from 'react-apexcharts'
import toast from 'react-hot-toast'
import { v4 as uuidv4 } from 'uuid'
import dayjs from 'dayjs'
import Select from 'react-select'

import { Tab, Tabs, TabList, TabPanel } from 'react-tabs'

import { MantineReactTable } from 'mantine-react-table'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import GenerateDetails from './GenerateDetails'
import { encryptPassword } from '../utils/libs'
import { ALERT_TRIGERRED, CHECKING_STAGE_NAME, HIGH_RISK, JETEZ, LOW_RISK, MODERATE_RISK, NOTIFICATION_SUCCESSFULY_UPDATED, RESULT_STAGE_NAME, RISK_ASSESSMENT_STAGE_NAME, RISK_CHARACTERIZATION_STAGE_NAME, VERY_HIGH_RISK } from '../utils/constants'
import Visualization, { VISUALIZATION_TYPE } from './Visualization'
import { decryptPassword } from '../utils/libs'

const dateFormat = 'YYYY-MM-DD'

dayjs.extend(customParseFormat)

ChartJS.register(ArcElement, Tooltip, Legend)

const INDICATORS_GROUP = 'IndicatorsGroup'
const DATA_ELEMENTS_GROUP = 'DataElementsGroup'

const selectboxOptions = [
    {
        label: 'Indicators Group',
        value: INDICATORS_GROUP,
    },
    {
        label: 'Data Elements Group',
        value: DATA_ELEMENTS_GROUP,
    },
]

const IGNORE_COORDINATES = 'IGNORE_COORDINATES'
const USE_ORG_UNIT_COORDINATES = 'USE_ORG_UNIT_COORDINATES'
const GENERATE_COORDINATES = 'GENERATE_COORDINATES'

const initialMapping = {
    use_same_ou: true,
    coordinates_distance: 5,
    display_on_dashboard: true,
    coordinates_strategy: IGNORE_COORDINATES,
}

export const data_loading_options = [
    {
        label: 'LAST_WEEK',
        value: 'LAST_WEEK',
    },
    {
        label: 'THIS_WEEK',
        value: 'THIS_WEEK',
    },
    {
        label: 'LAST_4_WEEKS',
        value: 'LAST_4_WEEKS',
    },
    {
        label: 'LAST_12_WEEKS',
        value: 'LAST_12_WEEKS',
    },
    {
        label: 'LAST_52_WEEKS',
        value: 'LAST_52_WEEKS',
    },
    {
        label: 'WEEKS_THIS_YEAR',
        value: 'WEEKS_THIS_YEAR',
    },
]

const DataList = () => {
    const compressedToggleButtonGroupPrefix = useGeneratedHtmlId({
        prefix: 'view_',
    })

    const [organisationUnits, setCurrentOrganisationUnits] = useState([])
    const [mappings, setMappings] = useState([])

    const [step4SelectedX, setStep4SelectedX] = useState('')
    const [step4SelectedY, setStep4SelectedY] = useState('')

    const [dashboardType, setDashboardType] = useState('All')
    const [displayType, setDisplayType] = useState('Table')

    const [step4CommentProbability, setStep4CommentProbability] = useState('')
    const [step4ConsequenceProbability, setStep4ConsequenceProbability] = useState('')
    const [step4ActionProbability, setStep4ActionProbability] = useState('')

    const [startDate, setStartDate] = useState(moment().subtract(1, 'weeks').startOf('week'))
    const [endDate, setEndDate] = useState(moment())
    const [selectedOrgUnit, setSelectedOrgUnit] = useState(null)
    const [programStartDate, setProgramStartDate] = useState(moment(startDate).format(dateFormat))
    const [programEndDate, setProgramEndDate] = useState(moment(endDate).format(dateFormat))
    const [currentDataRow, setCurrentDataRow] = useState(null)
    const [loading, setLoading] = useState(false)

    const [isSavingMappings, setIsSavingMappings] = useState(false)

    const [data, setData] = useState([])
    const [step, setStep] = useState(2)

    const titleID = useGeneratedHtmlId({ prefix: 'Alert details' })

    const [isFlyoutVisible, setIsFlyoutVisible] = useState(false)
    const [isAppWideConfigsRequired, setIsAppWideConfigsRequired] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)

    const [resultStepCommentValue, setResultStepCommentValue] = useState('')
    const [checkingStepCommentValue, setCheckingStepCommentValue] = useState('')

    const [step3CommentValue1, setStep3CommentValue1] = useState('')
    const [step3CommentValue2, setStep3CommentValue2] = useState('')
    const [step3CommentValue3, setStep3CommentValue3] = useState('')

    const [resultStepResultValue, setResultStepResultValue] = useState('')

    const [resultsStepOptions, setResultsStepOptions] = useState([])
    const [checkingStepOptions, setCheckingStepOptions] = useState([])

    const [isDataStoreCreated, setDataStoreCreated] = useState(false)

    const [toggleCompressedIdSelected, setToggleCompressedIdSelected] = useState(`${compressedToggleButtonGroupPrefix}__Table`)

    const [issaveCurrentMappingLoading, setIsCurrentMappingSaving] = useState(false)
    const [isRemoteFavoritesLoading, setIsRemoteFavoritesLoading] = useState(false)
    const [remoteDataElementGroups, setRemoteDataElementGroups] = useState([])
    const [currentDataElementGroups, setCurrentDataElementGroups] = useState([])
    const [remoteIndicatorGroups, setRemoteIndicatorGroups] = useState([])
    const [remoteOrganisationUnitLevels, setRemoteOrganisationUnitLevels] = useState([])
    const [remoteOrganisationUnits, setRemoteOrganisationUnits] = useState([])
    const [currentOrganisationUnitLevels, setCurrentOrganisationUnitLevels] = useState([])

    const [currentSelectedOULevel, setCurrentSelectedOULevel] = useState(null)
    const [remoteSelectedOULevel, setRemoteSelectedOULevel] = useState(null)

    const [targetDiseases, setTargetDiseases] = useState([])
    const [notificationsGravity, setNotificationsGravity] = useState([])
    const [notificationsSources, setNotificationsSources] = useState([])
    const [favorites, setFavorites] = useState([])
    const [favoritesData, setFavoritesData] = useState([])

    const [trackerPrograms, setTrackerPrograms] = useState([])
    const [currentOptionSets, setCurrentOptionSets] = useState([])

    const [currentMapping, setCurrentMapping] = useState({ ...initialMapping })

    const [favoriteConfigs, setFavoriteConfigs] = useState({})
    const [appSettings, setAppSettings] = useState({})

    const [me, setMe] = useState(null)
    const [pendingAction, setPendingAction] = useState(false)
    const [userRoles, setUserRoles] = useState([])

    const closePane = () => {
        setCurrentDataRow(null)
        setStep(2)
        setResultStepCommentValue('')
        setResultStepResultValue('')

        setCheckingStepCommentValue('')

        setStep3CommentValue1('')
        setStep3CommentValue2('')
        setStep3CommentValue3('')

        setStep4CommentProbability('')
        setStep4ConsequenceProbability('')
        setStep4ActionProbability('')

        setIsFlyoutVisible(false)
    }

    const retrieveCurrentTEI = async teiID => {
        const TEI_LINK = `${API_BASE_ROUTE}/trackedEntityInstances/${teiID}.json?program=${programId}&fields=*`
        const response = await axios.get(TEI_LINK)

        const tmpDataRow = {
            ...currentDataRow,
            tei: response.data,
        }

        setCurrentDataRow(tmpDataRow)
    }

    const [isCheckingStepCreationProcessing, setIsCheckingStepCreationProcessing] = useState(false)
    const handleCheckingStepCreation = async () => {
        try {
            setIsCheckingStepCreationProcessing(true)
            await retrieveCurrentTEI(currentDataRow?.tei?.trackedEntityInstance)
            const enrollmentObject = currentDataRow?.tei?.enrollments?.find(enrollment => enrollment.program === programId)
            const checkingEvent = enrollmentObject?.events?.find(event => event.program === programId && event.programStage === checkingProgramStage)

            let eventUID = ''

            if (!checkingEvent) {
                const response = await axios.get(API_BASE_ROUTE.concat('/system/id.json?limit=1'))

                eventUID = response.data.codes[0]
            } else {
                eventUID = checkingEvent?.event
            }
            let event_result = ''
            const optionLabel = checkingStepOptions.find(option => option.checked === 'on')?.label
            if (optionLabel === 'Discard') {
                event_result = 'Jetez'
            }

            if (optionLabel === 'Monitor') {
                event_result = 'Monitor'
            }

            if (optionLabel === `Starting ${RISK_ASSESSMENT_STAGE_NAME}`) {
                event_result = 'Debut'
            }

            const event = {
                trackedEntityInstance: currentDataRow?.tei?.trackedEntityInstance,
                enrollment: enrollmentObject?.enrollment,
                orgUnit: enrollmentObject?.orgUnit,
                event: eventUID,
                program: programId,
                eventDate: new Date(),
                programStage: checkingProgramStage,
                dataValues: [
                    {
                        dataElement: 'YNpB2DaFwhm',
                        value: event_result,
                    },
                    {
                        dataElement: 'NSZBs9eIWJF',
                        value: checkingStepCommentValue,
                    },
                ]
            }

            if (checkingEvent) {
                await axios.put(`${API_BASE_ROUTE}/events/${eventUID}.json`, { ...event })

                setIsCheckingStepCreationProcessing(false)
                toast.success(NOTIFICATION_SUCCESSFULY_UPDATED)
            } else {
                await axios.post(`${API_BASE_ROUTE}/events.json`, { ...event })

                setIsCheckingStepCreationProcessing(false)
                toast.success(NOTIFICATION_SUCCESSFULY_UPDATED)
            }
        } catch (error) {
            setIsCheckingStepCreationProcessing(false)

            toast.error(error.message)
        }
    }

    const [isResultStepCreationProcessing, setIsResultStepCreationProcessing] = useState(false)
    const handleResultStepCreation = async () => {
        try {
            setIsResultStepCreationProcessing(true)
            await retrieveCurrentTEI(currentDataRow?.tei?.trackedEntityInstance)

            const enrollmentObject = currentDataRow?.tei?.enrollments?.find(enrollment => enrollment.program === programId)
            const resultEvent = enrollmentObject?.events?.find(event => event.program === programId && event.programStage === resultProgramStage)

            let eventUID = ''

            if (!resultEvent) {
                const response = await axios.get(API_BASE_ROUTE.concat('/system/id.json?limit=1'))

                eventUID = response.data.codes[0]
            } else {
                eventUID = resultEvent?.event
            }

            let event_result = ''
            const optionLabel = resultsStepOptions.find(option => option.checked === 'on')?.label

            if (optionLabel === 'Discard') {
                event_result = 'Jetez'
            }

            if (optionLabel === 'Monitor') {
                event_result = 'Moniteur'
            }

            if (optionLabel === 'Response') {
                event_result = 'Repondre'
            }

            const event = {
                trackedEntityInstance: currentDataRow?.tei?.trackedEntityInstance,
                enrollment: enrollmentObject?.enrollment,
                orgUnit: enrollmentObject?.orgUnit,
                event: eventUID,
                program: programId,
                eventDate: new Date(),
                programStage: resultProgramStage,
                dataValues: [
                    {
                        dataElement: 'oJeNyRwYTzu',
                        value: event_result,
                    },
                    {
                        dataElement: 'Zqu3wGr2SM6',
                        value: resultStepCommentValue,
                    },
                ]
            }

            if (resultEvent) {
                await axios.put(API_BASE_ROUTE.concat(`/events/${eventUID}.json`), { ...event })

                setIsResultStepCreationProcessing(false)
                toast.success(NOTIFICATION_SUCCESSFULY_UPDATED)
            } else {
                await axios.post(API_BASE_ROUTE.concat('/events.json'), { ...event })

                setIsResultStepCreationProcessing(false)
                toast.success(NOTIFICATION_SUCCESSFULY_UPDATED)
            }
        } catch (error) {
            setIsResultStepCreationProcessing(false)
            toast.error(error.message)
        }
    }

    const [isRiskAssessmentStepCreationProcessing, setIsRiskAssessmentStepCreationProcessing] = useState(false)
    const handleRiskAssessmentStepCreation = async () => {
        try {
            setIsRiskAssessmentStepCreationProcessing(true)
            await retrieveCurrentTEI(currentDataRow?.tei?.trackedEntityInstance)

            const enrollmentObject = currentDataRow?.tei?.enrollments?.find(enrollment => enrollment.program === programId)
            const riskAssessmentEvent = enrollmentObject?.events?.find(event => event.program === programId && event.programStage === riskAssessmentProgramStage)

            let eventUID = ''

            if (!riskAssessmentEvent) {
                const response = await axios.get(API_BASE_ROUTE.concat('/system/id.json?limit=1'))

                eventUID = response.data.codes[0]
            } else {
                eventUID = riskAssessmentEvent?.event
            }

            const event = {
                trackedEntityInstance: currentDataRow?.tei?.trackedEntityInstance,
                enrollment: enrollmentObject?.enrollment,
                orgUnit: enrollmentObject?.orgUnit,
                event: eventUID,
                program: programId,
                eventDate: new Date(),
                programStage: riskAssessmentProgramStage,
                dataValues: [
                    {
                        dataElement: 'AKVNiSP1S5n',
                        value: step3CommentValue1,
                    },
                    {
                        dataElement: 'Ldo7Qt0s7Kd',
                        value: step3CommentValue2,
                    },
                    {
                        dataElement: 'TFfeqM2nioT',
                        value: step3CommentValue3,
                    },
                ]
            }

            if (riskAssessmentEvent) {
                await axios.put(`${API_BASE_ROUTE}/events/${eventUID}.json`, { ...event })

                setIsRiskAssessmentStepCreationProcessing(false)
                toast.success(NOTIFICATION_SUCCESSFULY_UPDATED)
            } else {
                await axios.post(`${API_BASE_ROUTE}/events.json`, { ...event })

                setIsRiskAssessmentStepCreationProcessing(false)
                toast.success(NOTIFICATION_SUCCESSFULY_UPDATED)
            }
        } catch (error) {
            setIsRiskAssessmentStepCreationProcessing(false)
            toast.error(error.message)
        }
    }

    const [isRiskCharacterizationCreationProcessing, setIsRiskCharacterizationCreationProcessing] = useState(false)
    const handleRiskCharacterizationCreation = async (consequence, probabilite) => {
        try {
            setIsRiskCharacterizationCreationProcessing(true)
            setStep4XYValues(consequence, probabilite)

            const dataRow = { ...currentDataRow }
            dataRow.consequence = consequence
            dataRow.probabilite = probabilite

            await retrieveCurrentTEI(currentDataRow?.tei?.trackedEntityInstance)
            setCurrentDataRow(dataRow)

            const enrollmentObject = currentDataRow?.tei?.enrollments?.find(enrollment => enrollment.program === programId)
            const riskCharacterizationEvent = enrollmentObject?.events?.find(event => event.program === programId && event.programStage === riskCharacterizationProgramStage)

            let eventUID = ''

            if (!riskCharacterizationEvent) {
                const response = await axios.get(`${API_BASE_ROUTE}/system/id.json?limit=1`)

                eventUID = response.data.codes[0]
            } else {
                eventUID = riskCharacterizationEvent?.event
            }

            const event = {
                trackedEntityInstance: currentDataRow?.tei?.trackedEntityInstance,
                enrollment: enrollmentObject?.enrollment,
                orgUnit: enrollmentObject?.orgUnit,
                event: eventUID,
                program: programId,
                eventDate: new Date(),
                programStage: riskCharacterizationProgramStage,
                dataValues: [
                    {
                        dataElement: 'LyUT3KnXPCh',
                        value: consequence,
                    },
                    {
                        dataElement: 'S0JzhLojeos',
                        value: probabilite,
                    },
                    {
                        dataElement: 'FDRfcDfDFb3',
                        value: step4ActionProbability,
                    },
                    {
                        dataElement: 'l72mXq7ADJP',
                        value: step4CommentProbability,
                    },
                    {
                        dataElement: 'gvPjezVrTNF',
                        value: step4ConsequenceProbability,
                    },
                ]
            }

            if (riskCharacterizationEvent) {
                await axios.put(API_BASE_ROUTE.concat(`/events/${eventUID}.json`), { ...event })

                setIsRiskCharacterizationCreationProcessing(false)
                toast.success(NOTIFICATION_SUCCESSFULY_UPDATED)
            } else {
                await axios.post(API_BASE_ROUTE.concat('/events.json'), { ...event })

                setIsRiskCharacterizationCreationProcessing(false)
                toast.success(NOTIFICATION_SUCCESSFULY_UPDATED)
            }
        } catch (error) {
            setIsRiskCharacterizationCreationProcessing(false)

            toast.error(error.message)
        }
    }

    const loadCurrentMe = () => {
        setLoading(true)
        setMe(null)
        axios.get(`${API_BASE_ROUTE}/me.json?fields=id,name,organisationUnits[id],userCredentials[userRoles[id,displayName]],authorities`)
            .then(response => {
                setMe(response.data)

                setLoading(false)
            }).catch(error => {
                setMe(null)
                setLoading(false)
                toast.error(error.message)
            })
    }

    const loadCurrentUserRoles = () => {
        setLoading(true)
        setUserRoles([])
        axios.get(`${API_BASE_ROUTE}/userRoles.json?paging=false`)
            .then(response => {
                setUserRoles([...response.data.userRoles])

                setLoading(false)
            }).catch(error => {
                setUserRoles([])
                setLoading(false)
            })
    }

    const loadCurrentOrganisationUnitLevels = () => {
        setLoading(true)
        setCurrentOrganisationUnitLevels([])
        axios.get(`${API_BASE_ROUTE}/organisationUnitLevels.json?paging=false&fields=id,name,displayName,level`)
            .then(response => {
                setCurrentOrganisationUnitLevels([...response.data.organisationUnitLevels])

                setLoading(false)
            }).catch(error => {
                setCurrentOrganisationUnitLevels([])
                setLoading(false)
            })
    }

    const getLocationByID = id => {
        let fullOrgunitName = ''

        const currentOrgUnit = organisationUnits.find(orgUnit => orgUnit.id === id)
        const currentpath = currentOrgUnit.path.substring(1)

        const ou_ids = currentpath.split('/')
        for (const ou_id of ou_ids) {
            if (fullOrgunitName !== '') {
                fullOrgunitName = fullOrgunitName.concat(', ')
            }

            fullOrgunitName = fullOrgunitName.concat(organisationUnits.find(orgUnit => orgUnit.id === ou_id)?.displayName)
        }

        return fullOrgunitName
    }

    const loadCurrentOrganisationUnits = () => {
        setLoading(true)
        setCurrentOrganisationUnits([])

        axios.get(API_BASE_ROUTE.concat('/organisationUnits.json?paging=false&fields=id,name,displayName,level,parent,path'))
            .then(response => {
                setCurrentOrganisationUnits([...response.data.organisationUnits])

                setLoading(false)
            }).catch(error => {
                setLoading(false)

                setCurrentOrganisationUnits([])
            })
    }

    const getDiseaseFromCode = diseaseCode => {
        if (diseaseCode === 'FJ') {
            return 'Yellow Fever'
        }
        if (diseaseCode === 'COVID19') {
            return 'COVID-19'
        }
        if (diseaseCode === 'SBE') {
            return 'Events Based Surveillance'
        }
        if (diseaseCode === 'Diarrhee') {
            return 'Bloody Diarrhea'
        }
        if (diseaseCode === 'Méningite') {
            return 'Méningitis'
        }
        if (diseaseCode === 'TM') {
            return 'Maternal Tetanus'
        }
        if (diseaseCode === 'PFA') {
            return 'Polio (PFA)'
        }
        if (diseaseCode === 'TN') {
            return 'Neonatal Tetanus'
        }
        if (diseaseCode === 'FVH') {
            return 'Viral Hemorrhagic Fever'
        }
        if (diseaseCode === 'Paludisme') {
            return 'Malaria'
        }
        if (diseaseCode === 'Rougeole') {
            return 'Measles'
        }
        if (diseaseCode === 'MPV') {
            return 'Monkeypox virus'
        }
        if (diseaseCode === 'Peste') {
            return 'Plague Disease'
        }
        if (diseaseCode === 'Coqueluche') {
            return 'whooping cough'
        }
        if (diseaseCode === 'Cholera') {
            return 'Cholera'
        }
        if (diseaseCode === 'AC') {
            return 'Community Alert'
        }

        return ''
    }


    const proceedData = async () => {
        try {
            setIsProcessing(true)

            if (startDate > endDate) {
                setIsProcessing(false)

                toast.error('Invalid Date Range')
            } else {
                setIsProcessing(true)
                setData([])
                const route = `${TRACKED_ENTITY_INSTANCES_ROUTE}${selectedOrgUnit?.id}&paging=false&skipPaging=true&program=${programId}&programStartDate=${programStartDate}&programEndDate=${programEndDate}`

                const response = await axios.get(route)
                const d = response.data.trackedEntityInstances.filter(tei => tei.enrollments.filter(enrollment => enrollment.program === programId).length === 1)
                    .reduce((previous, current) => {
                        const enrollment = current.enrollments.find(enrollment => enrollment.program === programId)
                        const currentOrgUnit = organisationUnits.find(orgUnit => orgUnit.id === enrollment?.orgUnit)

                        let stepNo = 2

                        const checkingProgramStageEvent = enrollment?.events?.find(event => event?.programStage === checkingProgramStage)
                        const riskAssessmentProgramStageEvent = enrollment?.events?.find(event => event?.programStage === riskAssessmentProgramStage)
                        const riskCharacterizationProgramStageEvent = enrollment?.events?.find(event => event?.programStage === riskCharacterizationProgramStage)
                        const resultProgramStageEvent = enrollment?.events?.find(event => event?.programStage === resultProgramStage)

                        let currentStep = enrollment?.events?.filter(event => event?.programStage === checkingProgramStage)?.length > 0 ? 'Checking' : ALERT_TRIGERRED

                        if (currentStep && currentStep.length > 0 && riskAssessmentProgramStageEvent) {
                            currentStep = enrollment?.events?.filter(event => event?.programStage === riskAssessmentProgramStage)?.length > 0 ? RISK_ASSESSMENT_STAGE_NAME : 'Checking'

                            stepNo = currentStep === RISK_ASSESSMENT_STAGE_NAME && 3
                        }

                        if (currentStep && currentStep.length > 0 && riskCharacterizationProgramStageEvent) {
                            currentStep = enrollment?.events?.filter(event => event?.programStage === riskCharacterizationProgramStage)?.length > 0 ? RISK_CHARACTERIZATION_STAGE_NAME : RISK_ASSESSMENT_STAGE_NAME

                            stepNo = currentStep === RISK_CHARACTERIZATION_STAGE_NAME && 4
                        }

                        if (currentStep && currentStep.length > 0 && resultProgramStageEvent) {
                            currentStep = enrollment?.events?.filter(event => event?.programStage === resultProgramStage)?.length > 0 ? 'Result' : RISK_CHARACTERIZATION_STAGE_NAME

                            stepNo = currentStep === 'Result' && 5
                        }

                        const result = resultProgramStageEvent?.dataValues?.find(dataValue => dataValue.dataElement === 'oJeNyRwYTzu')?.value || '-'
                        const alertGravity = current?.attributes?.find(attribute => attribute.attribute === 't5L2TCuqKnI')?.value
                        const alertType = current.attributes.find(attribute => attribute.attribute === 'a7RxzBreTMS')?.value
                        const sourceAlertType = current?.attributes?.find(attribute => attribute.attribute === 'OPDvYKjb5o7')?.value

                        const consequence = riskCharacterizationProgramStageEvent?.dataValues?.find(dataValue => dataValue?.dataElement === 'LyUT3KnXPCh')?.value || ''
                        const probabilite = riskCharacterizationProgramStageEvent?.dataValues?.find(dataValue => dataValue?.dataElement === 'S0JzhLojeos')?.value || ''

                        const dataObject = {
                            tei: current,
                            consequence,
                            probabilite,
                            alertGravity,
                            sourceAlertType,
                            resultProgramStageEvent,
                            checkingProgramStageEvent,
                            riskAssessmentProgramStageEvent,
                            riskCharacterizationProgramStageEvent,
                            alertGravityDetails: notificationsGravity.find(o => o.code === alertGravity),

                            alertPeriod: current?.attributes?.find(attribute => attribute.attribute === 'uozZef64yst')?.value,
                            trigerredOn: moment(enrollment?.enrollmentDate).format(dateFormat),
                            eid: current.attributes.find(attribute => attribute.attribute === 'M45AzuHkWmK')?.value,
                            location: getLocationByID(currentOrgUnit?.id),
                            exactLocation: currentOrgUnit?.displayName,
                            alertType: getDiseaseFromCode(alertType),
                            diseaseTargetted: {
                                name: getDiseaseFromCode(alertType),
                                originalName: current.attributes.find(attribute => attribute.attribute === 'a7RxzBreTMS')?.value,
                                type: targetDiseases.find(o => o.code === alertType),
                            },
                            sourceALertDetails: notificationsSources.find(o => o.code === sourceAlertType),
                            locationType: currentOrganisationUnitLevels.find(orgUnitLevel => orgUnitLevel.level === currentOrgUnit?.level)?.displayName,
                            result: optionSetTranslator(result),
                            stageOfStep: currentStep,
                            step: currentStep,
                            risk: riskCharacterizationProgramStageEvent ? getRiskLevelCaption(consequence, probabilite) : '',
                            stepNo,
                        }
                        previous.push({ ...dataObject, dataRow: { ...dataObject } })

                        return previous
                    }, [])

                setData([...d])
                setIsProcessing(false)
                toast.success('Data Loaded Succesfully')
            }
        } catch (error) {
            toast.error(error.message)

            setIsProcessing(false)
        }
    }

    const setStep4XYValues = (x, y) => {
        setStep4SelectedX(x)

        setStep4SelectedY(y)
    }

    useEffect(() => {
        if (isDataStoreCreated) {
            loadCurrentMe()
            loadCurrentUserRoles()
            loadCurrentOrganisationUnitLevels()
            loadCurrentOrganisationUnits()

            loadTargetDiseases()
            loadTrackerPrograms()
            loadOptionSets()
            loadNotificationsSource()
            loadNotificationsGravity()
            loadCurrentDataElementGroups()
        } else {
            initDataStore()
        }
    }, [isDataStoreCreated])

    const saveMapping = async () => {
        if (currentMapping &&
            currentMapping?.coordinates_strategy &&
            currentMapping?.execution_period &&
            currentMapping?.hostname &&
            currentMapping?.username &&
            currentMapping?.password &&
            currentMapping?.alert_or_outbreak &&
            currentMapping?.target_disease &&
            currentMapping?.source &&
            currentMapping?.analytics_group &&
            currentMapping?.analytics_meta_group &&
            currentMapping?.generation_meta_group &&
            currentMapping?.generation_metadata) {
            try {
                setIsSavingMappings(true)
                const mappings_route = `${API_BASE_ROUTE}/dataStore/${process.env.REACT_APP_DATA_STORE_NAME}/${process.env.REACT_APP_MAPINGS}`
                const mappingsResponse = await axios.get(mappings_route)

                const m = { ...currentMapping, password: isPasswordEncrypted || currentMapping?.isPasswordEncrypted ? currentMapping?.password : encryptPassword(currentMapping?.password), id: uuidv4(), isPasswordEncrypted: true }

                const mappingData = currentMapping?.id ?
                    [...mappingsResponse.data.filter(m => m?.id !== currentMapping?.id), { ...m }] :
                    [...mappingsResponse.data, { ...m }]

                await axios.put(mappings_route, [...mappingData])
                const updatedMappingsResponse = await axios.get(mappings_route)

                setMappings([...updatedMappingsResponse.data])
                setCurrentMapping({ ...initialMapping })

                setIsSavingMappings(false)
                setIsMappingEditionModalVisible(false)
                toast.success('Operation was successful')
            } catch (error) {
                setIsSavingMappings(false)

                toast.error(error?.response?.data?.message || error.message)
            }
        } else {
            setIsSavingMappings(false)

            toast.error('All fields are required !')
        }
    }

    const initDataStore = async () => {
        const app_settings_route = `${API_BASE_ROUTE}/dataStore/${process.env.REACT_APP_DATA_STORE_NAME}/${process.env.REACT_APP_SETTINGS}`
        axios.get(app_settings_route)
            .then(response => {
                setDataStoreCreated(true)
                setAppSettings(response.data)

                const keys = Object.keys(response.data)
                if (keys.length === 0 ||
                    !keys.includes('notifications_source') ||
                    !keys.includes('notifications_alerts_or_outbreaks') ||
                    !keys.includes('target_diseases') ||
                    !keys.includes('notifications_program') ||
                    !keys.includes('admin_group') ||
                    !keys.includes('checking_stage') ||
                    !keys.includes('checking_stage_checking_notes_data_element') ||
                    !keys.includes('checking_stage_result_data_element') ||
                    !keys.includes('data_element_group') ||
                    !keys.includes('risk_evaluation_stage') ||
                    !keys.includes('risk_evaluation_stage_exposure_assessment_data_element') ||
                    !keys.includes('risk_evaluation_stage_hazard_assessment_data_element') ||
                    !keys.includes('risk_evaluation_stage_context_assessment_data_element') ||
                    !keys.includes('risk_characterization_stage') ||
                    !keys.includes('risk_characterization_stage_consequences_data_element') ||
                    !keys.includes('risk_characterization_stage_consequences_comment_data_element') ||
                    !keys.includes('risk_characterization_stage_probability_data_element') ||
                    !keys.includes('risk_characterization_stage_probability_actions_data_element') ||
                    !keys.includes('risk_characterization_stage_probability_comment_data_element') ||
                    !keys.includes('result_stage') ||
                    !keys.includes('result_stage_comments_data_element') ||
                    !keys.includes('result_stage_final_step_data_element')) {
                    setIsAppWideConfigsRequired(true)
                }
            }).catch(() => {
                axios.post(app_settings_route, {}).then(() => {
                    setIsAppWideConfigsRequired(true)

                    setDataStoreCreated(true)
                }).catch(() => setDataStoreCreated(false))
            })

        const mappings_route = `${API_BASE_ROUTE}/dataStore/${process.env.REACT_APP_DATA_STORE_NAME}/${process.env.REACT_APP_MAPINGS}`
        axios.get(mappings_route)
            .then(response => {
                setDataStoreCreated(true)

                setMappings([...response.data])
            }).catch(() => axios.post(mappings_route, [])
                .then(() => setDataStoreCreated(true))
                .catch(() => setDataStoreCreated(false)))

        const route_favorite = `${API_BASE_ROUTE}/dataStore/${process.env.REACT_APP_DATA_STORE_NAME}/${process.env.REACT_APP_FAVORITES_CONFIG}`
        axios.get(route_favorite)
            .then(response => {
                setDataStoreCreated(true)

                setFavorites(response.data)
                // loadSavedFavoritesData(response.data)
            }).catch(() => axios.post(route_favorite, [])
                .then(() => setDataStoreCreated(true))
                .catch(() => setDataStoreCreated(false)))
    }

    const radioGroupId = useGeneratedHtmlId({ prefix: 'radioGroup' })

    const checkingCardId = useGeneratedHtmlId({
        prefix: 'checkableCard',
        suffix: '01',
    })

    const riskAssessmentCardId = useGeneratedHtmlId({
        prefix: 'riskAssessmentCard',
        suffix: '02',
    })

    const riskCharacterizationCardId = useGeneratedHtmlId({
        prefix: 'riskCharacterizationCard',
        suffix: '03',
    })

    const resultCardId = useGeneratedHtmlId({
        prefix: 'resultCard',
        suffix: '04',
    })

    const getRiskLevelCaption = (consequence, probabilite) => {
        if (consequence === 'Minimale' || (consequence === 'Mineur' && (probabilite === 'Improbable' || probabilite === 'TresImprobable'))) {
            return 'Low Risk'
        } else if ((consequence === 'Mineur' && (probabilite === 'Probable' || probabilite === 'HautementProbable' || probabilite === 'PresqueCertain')) ||
            (consequence === 'Modere' && (probabilite === 'Improbable' || probabilite === 'TresImprobable'))) {
            return 'Moderate Risk'
        } else if ((consequence === 'Modere' && (probabilite === 'Probable' || probabilite === 'HautementProbable' || probabilite === 'PresqueCertain')) ||
            (consequence === 'Severe' && (probabilite === 'Improbable' || probabilite === 'TresImprobable')) ||
            (consequence === 'Majeure' && (probabilite === 'TresImprobable' || probabilite === 'Improbable' || probabilite === 'Probable'))) {
            return 'High Risk'
        } else if ((consequence === 'Majeure' && (probabilite === 'PresqueCertain' || probabilite === 'HautementProbable')) || (consequence === 'Severe' && (probabilite === 'PresqueCertain' || probabilite === 'Probable' || probabilite === 'HautementProbable'))) {
            return 'Very High Risk'
        }

        else return ''
    }

    const getRiskLevelbackgroundColor = (consequence, probabilite) => {
        if (consequence === 'Minimale' || (consequence === 'Mineur' && (probabilite === 'Improbable' || probabilite === 'TresImprobable'))) {
            return '#599993'
        } else if ((consequence === 'Mineur' && (probabilite === 'Probable' || probabilite === 'HautementProbable' || probabilite === 'PresqueCertain')) ||
            (consequence === 'Modere' && (probabilite === 'Improbable' || probabilite === 'TresImprobable'))) {
            return '#f0ba47'
        } else if ((consequence === 'Modere' && (probabilite === 'Probable' || probabilite === 'HautementProbable' || probabilite === 'PresqueCertain')) ||
            (consequence === 'Severe' && (probabilite === 'Improbable' || probabilite === 'TresImprobable')) ||
            (consequence === 'Majeure' && (probabilite === 'TresImprobable' || probabilite === 'Improbable' || probabilite === 'Probable'))) {
            return '#e07855'
        } else if ((consequence === 'Majeure' && (probabilite === 'PresqueCertain' || probabilite === 'HautementProbable')) || (consequence === 'Severe' && (probabilite === 'PresqueCertain' || probabilite === 'Probable' || probabilite === 'HautementProbable'))) {
            return '#bf5a5c'
        }

        else return ''
    }

    const dataFilter = () => {
        if (dashboardType === 'Aggregate') {
            return [...data].filter(d => d.sourceAlertType === 'Aggregate')
        }
        else if (dashboardType === 'CBS') {
            return [...data].filter(d => d.sourceAlertType === 'CBS')
        }
        else if (dashboardType === 'Community') {
            return [...data].filter(d => d.sourceAlertType === 'Community')
        }
        else if (dashboardType === 'GrandPublic') {
            return [...data].filter(d => d.sourceAlertType === 'GrandPublic')
        }

        else return [...data]
    }

    const countInvestigatedAlertsData = () => [...data].filter(d => (
        d?.step === CHECKING_STAGE_NAME ||
        d?.step === RISK_ASSESSMENT_STAGE_NAME ||
        d?.step === RISK_CHARACTERIZATION_STAGE_NAME ||
        d?.step === RESULT_STAGE_NAME
    ) && d.alertGravity === 'SimpleAlert').length || 0

    const countCancelledAlertsData = () => [...data].filter(d => d?.alertGravity === 'SimpleAlert' && (
        d?.checkingProgramStageEvent?.dataValues?.find(dataValue => dataValue?.dataElement === 'YNpB2DaFwhm')?.value === JETEZ ||
        d?.resultProgramStageEvent?.dataValues?.find(dataValue => dataValue?.dataElement === 'oJeNyRwYTzu')?.value === JETEZ)
    ).length || 0

    const countConfirmedAlertsData = () => countInvestigatedAlertsData() - countCancelledAlertsData() || 0

    const countInvestigatedOutbreaksData = () => [...data].filter(d => (
        d?.step === CHECKING_STAGE_NAME ||
        d?.step === RISK_ASSESSMENT_STAGE_NAME ||
        d?.step === RISK_CHARACTERIZATION_STAGE_NAME ||
        d?.step === RESULT_STAGE_NAME
    ) && d.alertGravity === 'OutbreakAlert').length || 0

    const countCancelledOutbreaksData = () => [...data].filter(d => d?.alertGravity === 'OutbreakAlert' && (
        d?.checkingProgramStageEvent?.dataValues?.find(dataValue => dataValue?.dataElement === 'YNpB2DaFwhm')?.value === JETEZ ||
        d?.resultProgramStageEvent?.dataValues?.find(dataValue => dataValue?.dataElement === 'oJeNyRwYTzu')?.value === JETEZ)
    ).length || 0

    const countConfirmedOutbreaksData = () => countInvestigatedOutbreaksData() - countCancelledOutbreaksData() || 0

    const countAlertsLowRisk = () => [...data].filter(d => d.risk === LOW_RISK && d.alertGravity === 'SimpleAlert').length || 0
    const countOutbreaksLowRisk = () => [...data].filter(d => d.risk === LOW_RISK && d.alertGravity === 'OutbreakAlert').length || 0

    const countAlertsModerateRisk = () => [...data].filter(d => d.risk === MODERATE_RISK && d.alertGravity === 'SimpleAlert').length || 0
    const countOutbreaksModerateRisk = () => [...data].filter(d => d.risk === MODERATE_RISK && d.alertGravity === 'OutbreakAlert').length || 0

    const countAlertsHighRisk = () => [...data].filter(d => d.risk === HIGH_RISK && d.alertGravity === 'SimpleAlert').length || 0
    const countOutbreaksHighRisk = () => [...data].filter(d => d.risk === HIGH_RISK && d.alertGravity === 'OutbreakAlert').length || 0

    const countAlertsVeryHighRisk = () => [...data].filter(d => d.risk === VERY_HIGH_RISK && d.alertGravity === 'SimpleAlert').length || 0
    const countOutbreaksVeryHighRisk = () => [...data].filter(d => d.risk === VERY_HIGH_RISK && d.alertGravity === 'OutbreakAlert').length || 0

    const countAggregateData = () => [...data].filter(d => d.sourceAlertType === 'Aggregate').length || 0
    const countSimpleAggregateData = () => [...data].filter(d => d.sourceAlertType === 'Aggregate' && d.alertGravity === 'SimpleAlert').length || 0
    const countOutbreaksAggregateData = () => [...data].filter(d => d.sourceAlertType === 'Aggregate' && d.alertGravity === 'OutbreakAlert').length || 0
    const countOutbreaksGrandPublic = () => [...data].filter(d => d.sourceAlertType === 'GrandPublic' && d.alertGravity === 'OutbreakAlert').length || 0
    const countOutbreaksCommunityData = () => [...data].filter(d => d.sourceAlertType === 'Community' && d.alertGravity === 'OutbreakAlert').length || 0

    const countCBSData = () => [...data].filter(d => d.sourceAlertType === 'CBS').length || 0
    const countSimpleCBSData = () => [...data].filter(d => d.sourceAlertType === 'CBS' && d.alertGravity === 'SimpleAlert').length || 0
    const countOutbreaksCBSData = () => [...data].filter(d => d.sourceAlertType === 'CBS' && d.alertGravity === 'OutbreakAlert').length || 0

    const countCommunityData = () => [...data].filter(d => d.sourceAlertType === 'Community').length || 0
    const countGrandPublicData = () => [...data].filter(d => d.sourceAlertType === 'GrandPublic').length || 0

    const countAggregateAlertTrigerredData = () => [...data].filter(d => d.sourceAlertType === 'Aggregate' && d.step !== 'Checking' && d.step !== RISK_ASSESSMENT_STAGE_NAME && d.step !== RISK_CHARACTERIZATION_STAGE_NAME && d.step !== 'Result')?.length || 0
    const countCBSAlertTrigerredData = () => [...data].filter(d => d.sourceAlertType === 'CBS' && d.step !== 'Checking' && d.step !== RISK_ASSESSMENT_STAGE_NAME && d.step !== RISK_CHARACTERIZATION_STAGE_NAME && d.step !== 'Result')?.length || 0
    const countCommunityAlertTrigerredData = () => [...data].filter(d => d.sourceAlertType === 'Community' && d.step !== 'Checking' && d.step !== RISK_ASSESSMENT_STAGE_NAME && d.step !== RISK_CHARACTERIZATION_STAGE_NAME && d.step !== 'Result')?.length || 0
    const countGrandPublicAlertTrigerredData = () => [...data].filter(d => d.sourceAlertType === 'GrandPublic' && d.step !== 'Checking' && d.step !== RISK_ASSESSMENT_STAGE_NAME && d.step !== RISK_CHARACTERIZATION_STAGE_NAME && d.step !== 'Result')?.length || 0

    const countAggregateCheckingData = () => [...data].filter(d => d.sourceAlertType === 'Aggregate' && d.step === 'Checking')?.length || 0
    const countCBSCheckingData = () => [...data].filter(d => d.sourceAlertType === 'CBS' && d.step === 'Checking')?.length || 0
    const countCommunityCheckingData = () => [...data].filter(d => d.sourceAlertType === 'Community' && d.step === 'Checking')?.length || 0
    const countGrandPublicCheckingData = () => [...data].filter(d => d.sourceAlertType === 'GrandPublic' && d.step === 'Checking')?.length || 0

    const countAlertTrigerredData = () => {
        if (dashboardType === 'Aggregate') {
            return countAggregateAlertTrigerredData()
        }
        else if (dashboardType === 'CBS') {
            return countCBSAlertTrigerredData()
        }
        else if (dashboardType === 'Community') {
            return countCommunityAlertTrigerredData()
        }
        else if (dashboardType === 'GrandPublic') {
            return countGrandPublicAlertTrigerredData()
        }
        else {
            return countAggregateAlertTrigerredData() + countCBSAlertTrigerredData() + countCommunityAlertTrigerredData() + countGrandPublicAlertTrigerredData()
        }
    }

    const countCheckingData = () => {
        if (dashboardType === 'Aggregate') {
            return countAggregateCheckingData()
        }
        else if (dashboardType === 'CBS') {
            return countCBSCheckingData()
        }
        else if (dashboardType === 'Community') {
            return countCommunityCheckingData()
        }
        else if (dashboardType === 'GrandPublic') {
            return countGrandPublicCheckingData()
        }
        else {
            return countAggregateCheckingData() + countCBSCheckingData() + countCommunityCheckingData() + countGrandPublicCheckingData()
        }
    }

    const countAggregateRiskAssessmentData = () => [...data].filter(d => d.sourceAlertType === 'Aggregate' && d.step === RISK_ASSESSMENT_STAGE_NAME)?.length || 0
    const countCBSRiskAssessmentData = () => [...data].filter(d => d.sourceAlertType === 'CBS' && d.step === RISK_ASSESSMENT_STAGE_NAME)?.length || 0
    const countCommunityRiskAssessmentData = () => [...data].filter(d => d.sourceAlertType === 'Community' && d.step === RISK_ASSESSMENT_STAGE_NAME)?.length || 0
    const countGrandPublicRiskAssessmentData = () => [...data].filter(d => d.sourceAlertType === 'GrandPublic' && d.step === RISK_ASSESSMENT_STAGE_NAME)?.length || 0

    const countRiskAssessmentData = () => {
        if (dashboardType === 'Aggregate') {
            return countAggregateRiskAssessmentData()
        }
        else if (dashboardType === 'CBS') {
            return countCBSRiskAssessmentData()
        }
        else if (dashboardType === 'Community') {
            return countCommunityRiskAssessmentData()
        }
        else if (dashboardType === 'GrandPublic') {
            return countGrandPublicRiskAssessmentData()
        } else {
            return countAggregateRiskAssessmentData() + countCBSRiskAssessmentData() + countCommunityRiskAssessmentData() + countGrandPublicRiskAssessmentData()
        }
    }

    const countAggregateRiskCharacterizationData = () => [...data].filter(d => d.sourceAlertType === 'Aggregate' && d.step === RISK_CHARACTERIZATION_STAGE_NAME)?.length || 0
    const countCBSRiskCharacterizationData = () => [...data].filter(d => d.sourceAlertType === 'CBS' && d.step === RISK_CHARACTERIZATION_STAGE_NAME)?.length || 0
    const countCommunityRiskCharacterizationData = () => [...data].filter(d => d.sourceAlertType === 'Community' && d.step === RISK_CHARACTERIZATION_STAGE_NAME)?.length || 0
    const countGrandPublicRiskCharacterizationData = () => [...data].filter(d => d.sourceAlertType === 'GrandPublic' && d.step === RISK_CHARACTERIZATION_STAGE_NAME)?.length || 0

    const countRiskCharacterizationData = () => {
        if (dashboardType === 'Aggregate') {
            return countAggregateRiskCharacterizationData()
        }
        else if (dashboardType === 'CBS') {
            return countCBSRiskCharacterizationData()
        }
        else if (dashboardType === 'Community') {
            return countCommunityRiskCharacterizationData()
        }
        else if (dashboardType === 'GrandPublic') {
            return countGrandPublicRiskCharacterizationData()
        }
        else {
            return countAggregateRiskCharacterizationData() + countCBSRiskCharacterizationData() + countCommunityRiskCharacterizationData() + countGrandPublicRiskCharacterizationData()
        }
    }

    const countAggregateResultData = () => [...data].filter(d => d.sourceAlertType === 'Aggregate' && d.step === 'Result')?.length
    const countCBSResultData = () => [...data].filter(d => d.sourceAlertType === 'CBS' && d.step === 'Result')?.length
    const countCommunityResultData = () => [...data].filter(d => d.sourceAlertType === 'Community' && d.step === 'Result')?.length
    const countGrandPublicResultData = () => [...data].filter(d => d.sourceAlertType === 'GrandPublic' && d.step === 'Result')?.length

    const countResultData = () => {
        if (dashboardType === 'Aggregate') {
            return countAggregateResultData()
        }
        else if (dashboardType === 'CBS') {
            return countCBSResultData()
        }
        else if (dashboardType === 'Community') {
            return countCommunityResultData()
        }
        else if (dashboardType === 'GrandPublic') {
            return countGrandPublicResultData()
        } else {
            return countAggregateResultData() + countCBSResultData() + countCommunityResultData() + countGrandPublicResultData()
        }
    }

    const onChangeCompressed = optionId => {
        setToggleCompressedIdSelected(optionId)

        if (optionId.includes('Table')) {
            setDisplayType('Table')
        }

        if (optionId.includes('Map')) {
            setDisplayType('Map')
        }

        if (optionId.includes('Stat')) {
            setDisplayType('Stat')
        }

        if (optionId.includes('Overview')) {
            setDisplayType('Overview')
        }

        if (optionId.includes('Favorite')) {
            setDisplayType('Favorite')
        }

        if (optionId === 'Settings') {
            setDisplayType('Settings')
        }
    }

    const optionSetTranslator = stringToTranslate => {
        if (stringToTranslate === 'Moniteur') {
            return 'Monitor'
        }
        if (stringToTranslate === 'Jetez') {
            return 'Discard'
        }
        if (stringToTranslate === 'Repondre') {
            return 'Response'
        }
        if (stringToTranslate === 'Debut') {
            return 'Risk Asssess'
        }

        return stringToTranslate
    }

    const tabs = [
        {
            id: 'StagesID',
            name: 'Stages',
            content: (
                <>
                    <EuiSpacer size='m' />
                    {
                        currentDataRow && currentDataRow.stepNo && (
                            <EuiFormFieldset>
                                <EuiCheckableCard
                                    id={checkingCardId}
                                    label='Checking'
                                    name={radioGroupId}
                                    value='Checking'
                                    checked={step === 2}
                                    onChange={() => setStep(2)} >
                                    {
                                        step === 2 && (
                                            <>
                                                <div className='row'>
                                                    <div className='col-5'>
                                                        <br />
                                                        <EuiPanel hasBorder grow hasShadow borderRadius>
                                                            <EuiText grow={false}>
                                                                <div style={{ marginTop: '20px', }}>
                                                                    <strong>
                                                                        Checking Notes
                                                                    </strong>
                                                                </div>
                                                                <div>
                                                                    <EuiTextArea
                                                                        style={{ width: '100%' }}
                                                                        fullWidth
                                                                        placeholder='Your notes goes here ..'
                                                                        aria-label='notes'
                                                                        value={checkingStepCommentValue}
                                                                        onChange={e => setCheckingStepCommentValue(e.target.value)} />
                                                                </div>
                                                                <div>
                                                                    <small>
                                                                        This area supports markdowns
                                                                    </small>
                                                                </div>
                                                            </EuiText>

                                                            <EuiText grow={false}>
                                                                <div style={{ marginTop: '30px', }}>
                                                                    <strong>
                                                                        Result
                                                                    </strong>
                                                                </div>
                                                            </EuiText>

                                                            <EuiSelectable
                                                                onChange={newOptions => setCheckingStepOptions(newOptions)}
                                                                listProps={{ bordered: true }}
                                                                aria-label='Single selection'
                                                                options={checkingStepOptions}
                                                                singleSelection >
                                                                {list => list}
                                                            </EuiSelectable>

                                                            <div style={{ marginTop: '20px', }}>
                                                                <EuiButton
                                                                    size='s'
                                                                    fill
                                                                    isLoading={isCheckingStepCreationProcessing}
                                                                    onClick={handleCheckingStepCreation} >
                                                                    Submit
                                                                </EuiButton>
                                                            </div>
                                                        </EuiPanel>
                                                    </div>
                                                </div>
                                            </>
                                        )
                                    }
                                </EuiCheckableCard>

                                <EuiSpacer size='m' />
                                <EuiCheckableCard
                                    disabled={currentDataRow?.checkingProgramStageEvent?.dataValues?.find(dataValue => dataValue?.dataElement === 'YNpB2DaFwhm')?.value === 'Jetez'}
                                    id={riskAssessmentCardId}
                                    label={RISK_ASSESSMENT_STAGE_NAME}
                                    name={radioGroupId}
                                    value={RISK_ASSESSMENT_STAGE_NAME}
                                    checked={step === 3}
                                    onChange={() => setStep(3)} >
                                    {
                                        step === 3 && (
                                            <>
                                                <div className='row'>
                                                    <div className='col-5'>
                                                        <br />
                                                        <EuiText grow={false}>
                                                            <div style={{ marginTop: '20px', }}>
                                                                <strong>
                                                                    Hazard Rating
                                                                </strong>
                                                            </div>
                                                            <div>
                                                                <EuiTextArea
                                                                    style={{ width: '100%' }}
                                                                    fullWidth
                                                                    placeholder='Your notes goes here ..'
                                                                    aria-label='notes'
                                                                    value={step3CommentValue1}
                                                                    onChange={e => setStep3CommentValue1(e.target.value)} />
                                                            </div>
                                                        </EuiText>

                                                        <EuiText grow={false}>
                                                            <div style={{ marginTop: '20px', }}>
                                                                <strong>
                                                                    Exposure Rating
                                                                </strong>
                                                            </div>

                                                            <div>
                                                                <EuiTextArea
                                                                    style={{ width: '100%' }}
                                                                    fullWidth
                                                                    placeholder='Your notes goes here ..'
                                                                    aria-label='notes'
                                                                    value={step3CommentValue2}
                                                                    onChange={e => setStep3CommentValue2(e.target.value)} />
                                                            </div>
                                                        </EuiText>

                                                        <EuiText grow={false}>
                                                            <div style={{ marginTop: '20px', }}>
                                                                <strong>
                                                                    Assessment Context
                                                                </strong>
                                                            </div>
                                                            <div>
                                                                <EuiTextArea
                                                                    style={{ width: '100%' }}
                                                                    fullWidth
                                                                    placeholder='Your notes goes here ..'
                                                                    aria-label='notes'
                                                                    value={step3CommentValue3}
                                                                    onChange={e => setStep3CommentValue3(e.target.value)} />
                                                            </div>
                                                        </EuiText>

                                                        <div style={{ marginTop: '20px', }}>
                                                            <EuiButton
                                                                size='s'
                                                                isLoading={isRiskAssessmentStepCreationProcessing}
                                                                fill
                                                                onClick={handleRiskAssessmentStepCreation} >
                                                                Submit
                                                            </EuiButton>
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        )
                                    }
                                </EuiCheckableCard>

                                <EuiSpacer size='m' />
                                <EuiCheckableCard
                                    id={riskCharacterizationCardId}
                                    label={RISK_CHARACTERIZATION_STAGE_NAME}
                                    name={radioGroupId}
                                    value={RISK_CHARACTERIZATION_STAGE_NAME}
                                    checked={step === 4}
                                    disabled={currentDataRow.stepNo < 3 || currentDataRow?.checkingProgramStageEvent?.dataValues?.find(dataValue => dataValue?.dataElement === 'YNpB2DaFwhm')?.value === 'Jetez'}
                                    onChange={() => setStep(4)} >
                                    {
                                        step === 4 && (
                                            <>
                                                <EuiFlexGrid columns={3}>
                                                    <EuiFlexItem>
                                                        <EuiText grow={false}>
                                                            <div style={{ marginTop: '20px', }}>
                                                                <strong>
                                                                    Comments on Probabilities
                                                                </strong>
                                                            </div>
                                                            <div>
                                                                <EuiTextArea
                                                                    style={{ width: '100%' }}
                                                                    fullWidth
                                                                    placeholder='Your comments goes here ..'
                                                                    aria-label='comments'
                                                                    value={step4CommentProbability}
                                                                    onChange={e => setStep4CommentProbability(e.target.value)} />
                                                            </div>
                                                        </EuiText>
                                                    </EuiFlexItem>

                                                    <EuiFlexItem>
                                                        <EuiText grow={false}>
                                                            <div style={{ marginTop: '20px', }}>
                                                                <strong>
                                                                    Comments on the Consequences
                                                                </strong>
                                                            </div>
                                                            <div>
                                                                <EuiTextArea
                                                                    style={{ width: '100%' }}
                                                                    fullWidth
                                                                    placeholder='Your notes goes here ..'
                                                                    aria-label='notes'
                                                                    value={step4ConsequenceProbability}
                                                                    onChange={e => setStep4ConsequenceProbability(e.target.value)} />
                                                            </div>
                                                        </EuiText>
                                                    </EuiFlexItem>

                                                    <EuiFlexItem>
                                                        <EuiText grow={false}>
                                                            <div style={{ marginTop: '20px', }}>
                                                                <strong>
                                                                    Actions
                                                                </strong>
                                                            </div>
                                                            <div>
                                                                <EuiTextArea
                                                                    style={{ width: '100%' }}
                                                                    fullWidth
                                                                    placeholder='Your notes goes here ..'
                                                                    aria-label='notes'
                                                                    value={step4ActionProbability}
                                                                    onChange={e => setStep4ActionProbability(e.target.value)} />
                                                            </div>
                                                        </EuiText>
                                                    </EuiFlexItem>
                                                </EuiFlexGrid>

                                                <EuiSpacer size='m' />

                                                <EuiFlexGroup wrap>
                                                    <EuiFlexItem style={{ maxWidth: 100 }}>
                                                        <EuiButton
                                                            size='s'
                                                            isLoading={isRiskCharacterizationCreationProcessing}
                                                            fill
                                                            onClick={() => handleRiskCharacterizationCreation(currentDataRow?.consequence, currentDataRow?.probabilite)} >
                                                            Submit
                                                        </EuiButton>
                                                        <EuiSpacer size='m' />
                                                    </EuiFlexItem>
                                                </EuiFlexGroup>

                                                <EuiSpacer size='m' />

                                                <EuiFlexGrid columns={1}>
                                                    <EuiFlexItem>
                                                        <EuiPanel hasBorder grow hasShadow borderRadius>
                                                            <table style={{ minHeight: '400px', maxHeight: '400px', margin: '40px auto' }} cellPadding={0} cellSpacing={0}>
                                                                <tr>
                                                                    <td style={{ backgroundColor: 'transparent', border: '1px dotted #dedede', verticalAlign: 'middle', textAlign: 'center' }} rowSpan={6}>
                                                                        <div className='outer' >
                                                                            <div className='inner rotate'>
                                                                                <strong style={{ margin: '10px auto' }}>
                                                                                    <u>
                                                                                        Probabilities
                                                                                    </u>
                                                                                </strong>
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                                <tr>
                                                                    <td style={{ width: '200px', fontWeight: 'normal', minHeight: '10px', border: '0px solid transparent', verticalAlign: 'middle', textAlign: 'right', backgroundColor: 'transparent' }}>
                                                                        <EuiToolTip
                                                                            position='top'
                                                                            content={
                                                                                <p>
                                                                                    Expected in the majority of cases: <br /> Probability of 95% and more
                                                                                </p>
                                                                            }>
                                                                            <strong style={{ margin: '10px', cursor: 'help' }}>
                                                                                Almost Certain
                                                                            </strong>
                                                                        </EuiToolTip>
                                                                    </td>
                                                                    <td onClick={() => {
                                                                        handleRiskCharacterizationCreation('Minimale', 'PresqueCertain')
                                                                    }} style={{ width: '100px', minHeight: '10px', border: '1px solid #f2f2f2', fontWeight: 'bold', backgroundColor: '#599993', verticalAlign: 'middle', textAlign: 'center' }} className='hover-td'>
                                                                        <EuiIcon type='check' css={{ color: step4SelectedX === 'Minimale' && step4SelectedY === 'PresqueCertain' ? '#FFFFFF' : 'transparent', width: '50px', height: '50px', fontWeight: 'bold', margin: '0px auto' }} />
                                                                    </td>
                                                                    <td onClick={() => {
                                                                        handleRiskCharacterizationCreation('Mineur', 'PresqueCertain')
                                                                    }} style={{ width: '100px', minHeight: '10px', border: '1px solid #f2f2f2', fontWeight: 'bold', backgroundColor: '#f0ba47', verticalAlign: 'middle', textAlign: 'center' }} className='hover-td'>
                                                                        <EuiIcon type='check' css={{ color: step4SelectedX === 'Mineur' && step4SelectedY === 'PresqueCertain' ? '#FFFFFF' : 'transparent', width: '50px', height: '50px', fontWeight: 'bold', margin: '0px auto' }} />
                                                                    </td>
                                                                    <td onClick={() => {
                                                                        handleRiskCharacterizationCreation('Modere', 'PresqueCertain')
                                                                    }} style={{ width: '100px', minHeight: '10px', border: '1px solid #f2f2f2', fontWeight: 'bold', backgroundColor: '#e07855', verticalAlign: 'middle', textAlign: 'center' }} className='hover-td'>
                                                                        <EuiIcon type='check' css={{ color: step4SelectedX === 'Modere' && step4SelectedY === 'PresqueCertain' ? '#FFFFFF' : 'transparent', width: '50px', height: '50px', fontWeight: 'bold', margin: '0px auto' }} />
                                                                    </td>
                                                                    <td onClick={() => {
                                                                        handleRiskCharacterizationCreation('Majeure', 'PresqueCertain')
                                                                    }} style={{ width: '100px', minHeight: '10px', border: '1px solid #f2f2f2', fontWeight: 'bold', backgroundColor: '#bf5a5c', verticalAlign: 'middle', textAlign: 'center' }} className='hover-td'>
                                                                        <EuiIcon type='check' css={{ color: step4SelectedX === 'Majeure' && step4SelectedY === 'PresqueCertain' ? '#FFFFFF' : 'transparent', width: '50px', height: '50px', fontWeight: 'bold', margin: '0px auto' }} />
                                                                    </td>
                                                                    <td onClick={() => {
                                                                        handleRiskCharacterizationCreation('Severe', 'PresqueCertain')
                                                                    }} style={{ width: '100px', minHeight: '10px', border: '1px solid #f2f2f2', fontWeight: 'bold', backgroundColor: '#bf5a5c', verticalAlign: 'middle', textAlign: 'center' }} className='hover-td'>
                                                                        <EuiIcon type='check' css={{ color: step4SelectedX === 'Severe' && step4SelectedY === 'PresqueCertain' ? '#FFFFFF' : 'transparent', width: '50px', height: '50px', fontWeight: 'bold', margin: '0px auto' }} />
                                                                    </td>
                                                                    <td rowSpan={5} style={{ width: '50px', fontWeight: 'normal', minHeight: '10px', border: '0px solid transparent', verticalAlign: 'middle', textAlign: 'right', backgroundColor: 'transparent' }}>
                                                                    </td>
                                                                    <td style={{ width: '300px', textAlign: 'center', fontSize: '20px', fontWeight: 'thin', minHeight: '10px', border: '1px solid #dedede', verticalAlign: 'middle', backgroundColor: '#d7d7d7' }}>
                                                                        Overall Level of Risk
                                                                    </td>
                                                                </tr>
                                                                <tr>
                                                                    <td style={{ width: '200px', minHeight: '10px', border: '0px solid transparent', verticalAlign: 'middle', textAlign: 'right', backgroundColor: 'transparent' }}>
                                                                        <EuiToolTip
                                                                            position='top'
                                                                            content={
                                                                                <p>
                                                                                    Will likely occur in the majority of cases: <br /> Probability between 70% and 94%
                                                                                </p>
                                                                            }>
                                                                            <strong style={{ margin: '10px', cursor: 'help' }}>
                                                                                Highly Probable
                                                                            </strong>
                                                                        </EuiToolTip>
                                                                    </td>
                                                                    <td onClick={() => {
                                                                        handleRiskCharacterizationCreation('Minimale', 'HautementProbable')
                                                                    }} style={{ width: '100px', minHeight: '10px', border: '1px solid #f2f2f2', fontWeight: 'bold', backgroundColor: '#599993', verticalAlign: 'middle', textAlign: 'center' }} className='hover-td'>
                                                                        <EuiIcon type='check' css={{ color: step4SelectedX === 'Minimale' && step4SelectedY === 'HautementProbable' ? '#FFFFFF' : 'transparent', width: '50px', height: '50px', fontWeight: 'bold', margin: '0px auto' }} />
                                                                    </td>
                                                                    <td onClick={() => {
                                                                        handleRiskCharacterizationCreation('Mineur', 'HautementProbable')
                                                                    }} style={{ width: '100px', minHeight: '10px', border: '1px solid #f2f2f2', fontWeight: 'bold', backgroundColor: '#f0ba47', verticalAlign: 'middle', textAlign: 'center' }} className='hover-td'>
                                                                        <EuiIcon type='check' css={{ color: step4SelectedX === 'Mineur' && step4SelectedY === 'HautementProbable' ? '#FFFFFF' : 'transparent', width: '50px', height: '50px', fontWeight: 'bold', margin: '0px auto' }} />
                                                                    </td>
                                                                    <td onClick={() => {
                                                                        handleRiskCharacterizationCreation('Modere', 'HautementProbable')
                                                                    }} style={{ width: '100px', minHeight: '10px', border: '1px solid #f2f2f2', fontWeight: 'bold', backgroundColor: '#e07855', verticalAlign: 'middle', textAlign: 'center' }} className='hover-td'>
                                                                        <EuiIcon type='check' css={{ color: step4SelectedX === 'Modere' && step4SelectedY === 'HautementProbable' ? '#FFFFFF' : 'transparent', width: '50px', height: '50px', fontWeight: 'bold', margin: '0px auto' }} />
                                                                    </td>
                                                                    <td onClick={() => {
                                                                        handleRiskCharacterizationCreation('Majeure', 'HautementProbable')
                                                                    }} style={{ width: '100px', minHeight: '10px', border: '1px solid #f2f2f2', fontWeight: 'bold', backgroundColor: '#bf5a5c', verticalAlign: 'middle', textAlign: 'center' }} className='hover-td'>
                                                                        <EuiIcon type='check' css={{ color: step4SelectedX === 'Majeure' && step4SelectedY === 'HautementProbable' ? '#FFFFFF' : 'transparent', width: '50px', height: '50px', fontWeight: 'bold', margin: '0px auto' }} />
                                                                    </td>
                                                                    <td onClick={() => {
                                                                        handleRiskCharacterizationCreation('Severe', 'HautementProbable')
                                                                    }} style={{ width: '100px', minHeight: '10px', border: '1px solid #f2f2f2', fontWeight: 'bold', backgroundColor: '#bf5a5c', verticalAlign: 'middle', textAlign: 'center' }} className='hover-td'>
                                                                        <EuiIcon type='check' css={{ color: step4SelectedX === 'Severe' && step4SelectedY === 'HautementProbable' ? '#FFFFFF' : 'transparent', width: '50px', height: '50px', fontWeight: 'bold', margin: '0px auto' }} />
                                                                    </td>
                                                                    <td style={{ width: '300px', fontWeight: 'thin', minHeight: '10px', fontSize: '15px', border: '0px solid transparent', verticalAlign: 'middle', textAlign: 'center', backgroundColor: '#599993', color: '#FFFFFF' }}>
                                                                        <EuiToolTip
                                                                            position='top'
                                                                            content={
                                                                                <p>
                                                                                    Manage according to specific protocols, usual programs and established regulations (e.g. monitoring according to usual modalities) <br />
                                                                                </p>
                                                                            }>
                                                                            <strong style={{ cursor: 'help' }}>
                                                                                Low Risk
                                                                            </strong>
                                                                        </EuiToolTip>
                                                                    </td>
                                                                </tr>
                                                                <tr>
                                                                    <td style={{ width: '200px', minHeight: '10px', border: '0px solid transparent', verticalAlign: 'middle', textAlign: 'right', backgroundColor: 'transparent' }}>
                                                                        <EuiToolTip
                                                                            position='top'
                                                                            content={
                                                                                <p>
                                                                                    Will sometimes occur: <br /> Probability between 30% and 69%
                                                                                </p>
                                                                            }>
                                                                            <strong style={{ margin: '10px', cursor: 'help' }}>
                                                                                Probable
                                                                            </strong>
                                                                        </EuiToolTip>
                                                                    </td>
                                                                    <td onClick={() => {
                                                                        handleRiskCharacterizationCreation('Minimale', 'Probable')
                                                                    }} style={{ width: '100px', minHeight: '10px', border: '1px solid #f2f2f2', fontWeight: 'bold', backgroundColor: '#599993', verticalAlign: 'middle', textAlign: 'center' }} className='hover-td'>
                                                                        <EuiIcon type='check' css={{ color: step4SelectedX === 'Minimale' && step4SelectedY === 'Probable' ? '#FFFFFF' : 'transparent', width: '50px', height: '50px', fontWeight: 'bold', margin: '0px auto' }} />
                                                                    </td>
                                                                    <td onClick={() => {
                                                                        handleRiskCharacterizationCreation('Mineur', 'Probable')
                                                                    }} style={{ width: '100px', minHeight: '10px', border: '1px solid #f2f2f2', fontWeight: 'bold', backgroundColor: '#f0ba47', verticalAlign: 'middle', textAlign: 'center' }} className='hover-td'>
                                                                        <EuiIcon type='check' css={{ color: step4SelectedX === 'Mineur' && step4SelectedY === 'Probable' ? '#FFFFFF' : 'transparent', width: '50px', height: '50px', fontWeight: 'bold', margin: '0px auto' }} />
                                                                    </td>
                                                                    <td onClick={() => {
                                                                        handleRiskCharacterizationCreation('Modere', 'Probable')
                                                                    }} style={{ width: '100px', minHeight: '10px', border: '1px solid #f2f2f2', fontWeight: 'bold', backgroundColor: '#e07855', verticalAlign: 'middle', textAlign: 'center' }} className='hover-td'>
                                                                        <EuiIcon type='check' css={{ color: step4SelectedX === 'Modere' && step4SelectedY === 'Probable' ? '#FFFFFF' : 'transparent', width: '50px', height: '50px', fontWeight: 'bold', margin: '0px auto' }} />
                                                                    </td>
                                                                    <td onClick={() => {
                                                                        handleRiskCharacterizationCreation('Majeure', 'Probable')
                                                                    }} style={{ width: '100px', minHeight: '10px', border: '1px solid #f2f2f2', fontWeight: 'bold', backgroundColor: '#e07855', verticalAlign: 'middle', textAlign: 'center' }} className='hover-td'>
                                                                        <EuiIcon type='check' css={{ color: step4SelectedX === 'Majeure' && step4SelectedY === 'Probable' ? '#FFFFFF' : 'transparent', width: '50px', height: '50px', fontWeight: 'bold', margin: '0px auto' }} />
                                                                    </td>
                                                                    <td onClick={() => {
                                                                        handleRiskCharacterizationCreation('Severe', 'Probable')
                                                                    }} style={{ width: '100px', minHeight: '10px', border: '1px solid #f2f2f2', fontWeight: 'bold', backgroundColor: '#bf5a5c', verticalAlign: 'middle', textAlign: 'center' }} className='hover-td'>
                                                                        <EuiIcon type='check' css={{ color: step4SelectedX === 'Severe' && step4SelectedY === 'Probable' ? '#FFFFFF' : 'transparent', width: '50px', height: '50px', fontWeight: 'bold', margin: '0px auto' }} />
                                                                    </td>
                                                                    <td style={{ width: '300px', fontWeight: 'thin', minHeight: '10px', fontSize: '15px', border: '0px solid transparent', verticalAlign: 'middle', textAlign: 'center', backgroundColor: '#f0ba47', color: '#FFFFFF' }}>
                                                                        <EuiToolTip
                                                                            position='top'
                                                                            content={
                                                                                <p>
                                                                                    Specify roles and responsibilities of key players. Monitor or plan specific control measures (e.g. increased surveillance, additional vaccination campaigns) <br />
                                                                                </p>
                                                                            }>
                                                                            <strong style={{ cursor: 'help' }}>
                                                                                Moderate Risk
                                                                            </strong>
                                                                        </EuiToolTip>
                                                                    </td>
                                                                </tr>
                                                                <tr>
                                                                    <td style={{ width: '200px', minHeight: '10px', border: '0px solid transparent', verticalAlign: 'middle', textAlign: 'right', backgroundColor: 'transparent' }}>
                                                                        <EuiToolTip
                                                                            position='top'
                                                                            content={
                                                                                <p>
                                                                                    Could sometimes happen <br /> 5% to 29% probability
                                                                                </p>
                                                                            }>
                                                                            <strong style={{ margin: '10px', cursor: 'help' }}>
                                                                                Improbable
                                                                            </strong>
                                                                        </EuiToolTip>
                                                                    </td>
                                                                    <td onClick={() => {
                                                                        handleRiskCharacterizationCreation('Minimale', 'Improbable')
                                                                    }} style={{ width: '100px', minHeight: '10px', border: '1px solid #f2f2f2', fontWeight: 'bold', backgroundColor: '#599993', verticalAlign: 'middle', textAlign: 'center' }} className='hover-td'>
                                                                        <EuiIcon type='check' css={{ color: step4SelectedX === 'Minimale' && step4SelectedY === 'Improbable' ? '#FFFFFF' : 'transparent', width: '50px', height: '50px', fontWeight: 'bold', margin: '0px auto' }} />
                                                                    </td>
                                                                    <td onClick={() => {
                                                                        handleRiskCharacterizationCreation('Mineur', 'Improbable')
                                                                    }} style={{ width: '100px', minHeight: '10px', border: '1px solid #f2f2f2', fontWeight: 'bold', backgroundColor: '#599993', verticalAlign: 'middle', textAlign: 'center' }} className='hover-td'>
                                                                        <EuiIcon type='check' css={{ color: step4SelectedX === 'Mineur' && step4SelectedY === 'Improbable' ? '#FFFFFF' : 'transparent', width: '50px', height: '50px', fontWeight: 'bold', margin: '0px auto' }} />
                                                                    </td>
                                                                    <td onClick={() => {
                                                                        handleRiskCharacterizationCreation('Modere', 'Improbable')
                                                                    }} style={{ width: '100px', minHeight: '10px', border: '1px solid #f2f2f2', fontWeight: 'bold', backgroundColor: '#f0ba47', verticalAlign: 'middle', textAlign: 'center' }} className='hover-td'>
                                                                        <EuiIcon type='check' css={{ color: step4SelectedX === 'Modere' && step4SelectedY === 'Improbable' ? '#FFFFFF' : 'transparent', width: '50px', height: '50px', fontWeight: 'bold', margin: '0px auto' }} />
                                                                    </td>
                                                                    <td onClick={() => {
                                                                        handleRiskCharacterizationCreation('Majeure', 'Improbable')
                                                                    }} style={{ width: '100px', minHeight: '10px', border: '1px solid #f2f2f2', fontWeight: 'bold', backgroundColor: '#e07855', verticalAlign: 'middle', textAlign: 'center' }} className='hover-td'>
                                                                        <EuiIcon type='check' css={{ color: step4SelectedX === 'Majeure' && step4SelectedY === 'Improbable' ? '#FFFFFF' : 'transparent', width: '50px', height: '50px', fontWeight: 'bold', margin: '0px auto' }} />
                                                                    </td>
                                                                    <td onClick={() => {
                                                                        handleRiskCharacterizationCreation('Severe', 'Improbable')
                                                                    }} style={{ width: '100px', minHeight: '10px', border: '1px solid #f2f2f2', fontWeight: 'bold', backgroundColor: '#e07855', verticalAlign: 'middle', textAlign: 'center' }} className='hover-td'>
                                                                        <EuiIcon type='check' css={{ color: step4SelectedX === 'Severe' && step4SelectedY === 'Improbable' ? '#FFFFFF' : 'transparent', width: '50px', height: '50px', fontWeight: 'bold', margin: '0px auto' }} />
                                                                    </td>
                                                                    <td style={{ width: '300px', fontWeight: 'thin', minHeight: '10px', fontSize: '15px', border: '0px solid transparent', verticalAlign: 'middle', textAlign: 'center', backgroundColor: '#e07855', color: '#FFFFFF' }}>
                                                                        <EuiToolTip
                                                                            position='top'
                                                                            content={
                                                                                <p>
                                                                                    Seek the attention of the authorities responsible for management: the establishment of a control and command structure may be necessary; several control measures will be required, some of which could have significant consequences <br />
                                                                                </p>
                                                                            }>
                                                                            <strong style={{ cursor: 'help' }}>
                                                                                High Risk
                                                                            </strong>
                                                                        </EuiToolTip>
                                                                    </td>
                                                                </tr>
                                                                <tr>
                                                                    <td style={{ width: '200px', minHeight: '10px', border: '0px solid transparent', verticalAlign: 'middle', textAlign: 'right', backgroundColor: 'transparent' }}>
                                                                        <EuiToolTip
                                                                            position='top'
                                                                            content={
                                                                                <p>
                                                                                    Could occur in exceptional circumstances <br /> Probability less than 5%
                                                                                </p>
                                                                            }>
                                                                            <strong style={{ margin: '10px', cursor: 'help' }}>
                                                                                Very Unlikely
                                                                            </strong>
                                                                        </EuiToolTip>
                                                                    </td>
                                                                    <td onClick={() => {
                                                                        handleRiskCharacterizationCreation('Minimale', 'TresImprobable')
                                                                    }} style={{ width: '100px', minHeight: '10px', border: '1px solid #f2f2f2', fontWeight: 'bold', backgroundColor: '#599993', verticalAlign: 'middle', textAlign: 'center' }} className='hover-td'>
                                                                        <EuiIcon type='check' css={{ color: step4SelectedX === 'Minimale' && step4SelectedY === 'TresImprobable' ? '#FFFFFF' : 'transparent', width: '50px', height: '50px', fontWeight: 'bold', margin: '0px auto' }} />
                                                                    </td>
                                                                    <td onClick={() => {
                                                                        handleRiskCharacterizationCreation('Mineur', 'TresImprobable')
                                                                    }} style={{ width: '100px', minHeight: '10px', border: '1px solid #f2f2f2', fontWeight: 'bold', backgroundColor: '#599993', verticalAlign: 'middle', textAlign: 'center' }} className='hover-td'>
                                                                        <EuiIcon type='check' css={{ color: step4SelectedX === 'Mineur' && step4SelectedY === 'TresImprobable' ? '#FFFFFF' : 'transparent', width: '50px', height: '50px', fontWeight: 'bold', margin: '0px auto' }} />
                                                                    </td>
                                                                    <td onClick={() => {
                                                                        handleRiskCharacterizationCreation('Modere', 'TresImprobable')
                                                                    }} style={{ width: '100px', minHeight: '10px', border: '1px solid #f2f2f2', fontWeight: 'bold', backgroundColor: '#f0ba47', verticalAlign: 'middle', textAlign: 'center' }} className='hover-td'>
                                                                        <EuiIcon type='check' css={{ color: step4SelectedX === 'Modere' && step4SelectedY === 'TresImprobable' ? '#FFFFFF' : 'transparent', width: '50px', height: '50px', fontWeight: 'bold', margin: '0px auto' }} />
                                                                    </td>
                                                                    <td onClick={() => {
                                                                        handleRiskCharacterizationCreation('Majeure', 'TresImprobable')
                                                                    }} style={{ width: '100px', minHeight: '10px', border: '1px solid #f2f2f2', fontWeight: 'bold', backgroundColor: '#e07855', verticalAlign: 'middle', textAlign: 'center' }} className='hover-td'>
                                                                        <EuiIcon type='check' css={{ color: step4SelectedX === 'Majeure' && step4SelectedY === 'TresImprobable' ? '#FFFFFF' : 'transparent', width: '50px', height: '50px', fontWeight: 'bold', margin: '0px auto' }} />
                                                                    </td>
                                                                    <td onClick={() => {
                                                                        handleRiskCharacterizationCreation('Severe', 'TresImprobable')
                                                                    }} style={{ width: '100px', minHeight: '10px', border: '1px solid #f2f2f2', fontWeight: 'bold', backgroundColor: '#e07855', verticalAlign: 'middle', textAlign: 'center' }} className='hover-td'>
                                                                        <EuiIcon type='check' css={{ color: step4SelectedX === 'Severe' && step4SelectedY === 'TresImprobable' ? '#FFFFFF' : 'transparent', width: '50px', height: '50px', fontWeight: 'bold', margin: '0px auto' }} />
                                                                    </td>
                                                                    <td style={{ width: '300px', fontWeight: 'thin', minHeight: '10px', fontSize: '15px', border: '0px solid transparent', verticalAlign: 'middle', textAlign: 'center', backgroundColor: '#bf5a5c', color: '#FFFFFF' }}>
                                                                        <EuiToolTip
                                                                            position='top'
                                                                            content={
                                                                                <p>
                                                                                    Immediate response required even if the event is reported outside business hours. Involve management authorities: The establishment of a control and command structure should be completed within a few hours. The implementation of control measures that could have significant consequences is highly probable. <br />
                                                                                </p>
                                                                            }>
                                                                            <strong style={{ cursor: 'help' }}>
                                                                                Very High Risk
                                                                            </strong>
                                                                        </EuiToolTip>
                                                                    </td>
                                                                </tr>
                                                                <tr>
                                                                    <td colSpan={2}></td>
                                                                    <td style={{ width: '200px', minHeight: '10px', border: '0px solid transparent', verticalAlign: 'middle', textAlign: 'center', backgroundColor: 'transparent' }}>
                                                                        <EuiToolTip
                                                                            position='top'
                                                                            content={
                                                                                <p>
                                                                                    Limited impacts on the affected population <br /> Very little disruption to usual activities and services <br /> Basic interventions are sufficient and there is no need to implement additional control measures <br /> Very few additional costs for stakeholders
                                                                                </p>
                                                                            }>
                                                                            <strong style={{ cursor: 'help' }}>
                                                                                Minimale
                                                                            </strong>
                                                                        </EuiToolTip>
                                                                    </td>
                                                                    <td style={{ width: '200px', minHeight: '10px', border: '0px solid transparent', verticalAlign: 'middle', textAlign: 'center', backgroundColor: 'transparent' }}>
                                                                        <EuiToolTip
                                                                            position='top'
                                                                            content={
                                                                                <p>
                                                                                    Minor impacts on a small population or on a group at risk <br /> Limited disruption of usual activities and services <br /> A small number of additional control measures to put in place requiring a minimum of resources  <br /> Some additional costs for stakeholders
                                                                                </p>
                                                                            }>
                                                                            <strong style={{ cursor: 'help' }}>
                                                                                Minor
                                                                            </strong>
                                                                        </EuiToolTip>

                                                                    </td>
                                                                    <td style={{ width: '200px', minHeight: '10px', border: '0px solid transparent', verticalAlign: 'middle', textAlign: 'center', backgroundColor: 'transparent' }}>
                                                                        <EuiToolTip
                                                                            position='top'
                                                                            content={
                                                                                <p>
                                                                                    Moderate impacts on a large affected population or at-risk group <br /> Moderate disruptions to usual activities and services <br /> Additional control measures will be necessary, some of which will require resources <br /> Moderate increase in costs for stakeholders
                                                                                </p>
                                                                            }>
                                                                            <strong style={{ cursor: 'help' }}>
                                                                                Moderate
                                                                            </strong>
                                                                        </EuiToolTip>

                                                                    </td>
                                                                    <td style={{ width: '200px', minHeight: '10px', border: '0px solid transparent', verticalAlign: 'middle', textAlign: 'center', backgroundColor: 'transparent' }}>
                                                                        <EuiToolTip
                                                                            position='top'
                                                                            content={
                                                                                <p>
                                                                                    Major impacts on a small population or on a group at risk <br /> Major disruptions to usual activities and services <br /> A large number of additional control measures will be necessary, some of which will require significant resources <br /> Significant cost increase for stakeholders
                                                                                </p>
                                                                            }>
                                                                            <strong style={{ cursor: 'help' }}>
                                                                                Major
                                                                            </strong>
                                                                        </EuiToolTip>
                                                                    </td>
                                                                    <td style={{ width: '200px', minHeight: '10px', border: '0px solid transparent', verticalAlign: 'middle', textAlign: 'center', backgroundColor: 'transparent' }}>
                                                                        <EuiToolTip
                                                                            position='top'
                                                                            content={
                                                                                <p>
                                                                                    Severe impacts on a large population or on a group at risk <br /> Severe disruptions to usual activities and services <br /> A large number of additional control measures will have to be put in place, the majority of which will require significant resources <br /> Serious cost increase for stakeholders
                                                                                </p>
                                                                            }>
                                                                            <strong style={{ cursor: 'help' }}>
                                                                                Severe
                                                                            </strong>
                                                                        </EuiToolTip>

                                                                    </td>
                                                                </tr>
                                                                <tr>
                                                                    <td colSpan={2}></td>
                                                                    <td colSpan={5} style={{ verticalAlign: 'middle', textAlign: 'center', border: '1px dotted #dedede', padding: '10px' }}>
                                                                        <u>
                                                                            Consequences
                                                                        </u>
                                                                    </td>
                                                                    <td></td>
                                                                </tr>
                                                            </table>
                                                        </EuiPanel>
                                                    </EuiFlexItem>
                                                </EuiFlexGrid>
                                            </>
                                        )
                                    }
                                </EuiCheckableCard>

                                <EuiSpacer size='m' />
                                <EuiCheckableCard
                                    id={resultCardId}
                                    label='Result'
                                    name={radioGroupId}
                                    value='Result'
                                    disabled={currentDataRow.stepNo < 4 || currentDataRow?.checkingProgramStageEvent?.dataValues?.find(dataValue => dataValue?.dataElement === 'YNpB2DaFwhm')?.value === 'Jetez'}
                                    checked={step === 5}
                                    onChange={() => setStep(5)} >
                                    {
                                        step === 5 && (
                                            <>
                                                <div className='row'>
                                                    <div className='col-5'>
                                                        <br />

                                                        <EuiPanel hasBorder grow hasShadow borderRadius>
                                                            <EuiText grow={false}>
                                                                <div style={{ marginTop: '30px', }}>
                                                                    <strong>
                                                                        Result
                                                                    </strong>
                                                                </div>
                                                                <div>
                                                                    <small>
                                                                        Please select a result for the Alert bellow
                                                                    </small>
                                                                </div>
                                                            </EuiText>

                                                            <EuiSelectable
                                                                onChange={newOptions => setResultsStepOptions(newOptions)}
                                                                listProps={{ bordered: true }}
                                                                aria-label='Single selection'
                                                                options={resultsStepOptions}
                                                                singleSelection >
                                                                {list => list}
                                                            </EuiSelectable>

                                                            <EuiText grow={false}>
                                                                <div style={{ marginTop: '20px', }}>
                                                                    <strong>
                                                                        Comments
                                                                    </strong>
                                                                </div>
                                                                <div>
                                                                    <small>
                                                                        Please add any relevant comment
                                                                    </small>
                                                                </div>
                                                                <div>
                                                                    <EuiTextArea
                                                                        style={{ width: '100%' }}
                                                                        fullWidth
                                                                        placeholder='Comments goes here ..'
                                                                        aria-label='comment'
                                                                        value={resultStepCommentValue}
                                                                        onChange={e => setResultStepCommentValue(e.target.value)} />
                                                                </div>
                                                            </EuiText>

                                                            <div style={{ marginTop: '20px', }}>
                                                                <EuiButton
                                                                    size='s'
                                                                    isLoading={isResultStepCreationProcessing}
                                                                    fill
                                                                    onClick={handleResultStepCreation} >
                                                                    Submit
                                                                </EuiButton>
                                                            </div>
                                                        </EuiPanel>
                                                    </div>
                                                </div>
                                            </>
                                        )
                                    }
                                </EuiCheckableCard>
                            </EuiFormFieldset>
                        )
                    }
                </>
            ),
        },
        {
            id: 'ChartsID',
            name: 'Details',
            content: (
                <Fragment>
                    <GenerateDetails currentDataRow={currentDataRow} programStartDate={programStartDate} programEndDate={programEndDate} mappings={mappings} />
                </Fragment>
            ),
        },
    ]

    const loadCurrentDataElementGroups = async () => {
        try {
            setCurrentDataElementGroups([])
            const dataElementGroupsRoute = `${API_BASE_ROUTE}/dataElementGroups.json?paging=false&filter=name:ne:default&fields=id,name,displayName&order=displayName:ASC`
            const dataElementGroupsResponse = await axios.get(dataElementGroupsRoute)
            setCurrentDataElementGroups([...dataElementGroupsResponse.data.dataElementGroups])
        } catch (error) {
            setCurrentDataElementGroups([])

            toast.error(error.response.data.message || error.message)
        }
    }

    const connectToRemoteInstance = async () => {
        if (currentMapping?.hostname && currentMapping?.username && currentMapping?.password) {
            try {
                setIsCurrentMappingSaving(true)

                setRemoteDataElementGroups([])
                const dataElementGroupsRoute = `${currentMapping?.hostname}/api/29/dataElementGroups.json?paging=false&filter=name:ne:default&fields=id,name,displayName,dataElements[id,name,displayName]&order=displayName:ASC`
                const dataElementGroupsResponse = await axios.get(dataElementGroupsRoute, { auth: { username: currentMapping?.username, password: currentMapping?.password } })
                setRemoteDataElementGroups([...dataElementGroupsResponse.data.dataElementGroups])

                setRemoteIndicatorGroups([])
                const indicatorGroupsRoute = `${currentMapping?.hostname}/api/29/indicatorGroups.json?paging=false&fields=id,name,displayName,indicators[id,name,displayName]&order=displayName:ASC`
                const indicatorGroupsResponse = await axios.get(indicatorGroupsRoute, { auth: { username: currentMapping?.username, password: currentMapping?.password } })
                setRemoteIndicatorGroups([...indicatorGroupsResponse.data.indicatorGroups])

                setRemoteOrganisationUnitLevels([])
                const ouLevelsResponseRoute = `${currentMapping?.hostname}/api/29/organisationUnitLevels.json?paging=false&fields=id,name,displayName,level`
                const ouLevelsResponse = await axios.get(ouLevelsResponseRoute, { auth: { username: currentMapping?.username, password: currentMapping?.password } })
                setRemoteOrganisationUnitLevels(ouLevelsResponse.data.organisationUnitLevels)

                setRemoteOrganisationUnits([])
                const remoteOUResponseRoute = `${currentMapping?.hostname}/api/29/organisationUnits.json?paging=false&fields=id,name,displayName,level,parent,path`
                const remoteOUResponse = await axios.get(remoteOUResponseRoute, { auth: { username: currentMapping?.username, password: currentMapping?.password } })
                setRemoteOrganisationUnits(remoteOUResponse.data.organisationUnits)

                setIsCurrentMappingSaving(false)

                setCurrentMapping({ ...currentMapping, isPasswordEncrypted: false })
                toast.success('Connection was successful')
            } catch (error) {
                setIsCurrentMappingSaving(false)

                setRemoteOrganisationUnitLevels([])
                setRemoteDataElementGroups([])
                setRemoteOrganisationUnits([])
                setRemoteIndicatorGroups([])

                toast.error(error.response.data.message || error.message)
            }
        } else {
            setIsCurrentMappingSaving(false)

            setRemoteOrganisationUnitLevels([])
            setRemoteDataElementGroups([])
            setRemoteOrganisationUnits([])
            setRemoteIndicatorGroups([])

            toast.error('hostname, username and password are required !')
        }
    }

    const [remoteFavorites, setRemoteFavorites] = useState([])

    const loadRemoteFavorites = async () => {
        setIsRemoteFavoritesLoading(true)
        if (favoriteConfigs?.hostname && favoriteConfigs?.username && favoriteConfigs?.password) {
            try {
                setRemoteFavorites([])
                setIsRemoteFavoritesLoading(true)
                const response = favoriteConfigs?.is_map ?
                    await axios.get(`${favoriteConfigs?.hostname}/api/maps.json?paging=false`, { auth: { username: favoriteConfigs?.username, password: favoriteConfigs?.password } }) :
                    await axios.get(`${favoriteConfigs?.hostname}/api/visualizations.json?paging=false`, { auth: { username: favoriteConfigs?.username, password: favoriteConfigs?.password } })

                favoriteConfigs?.is_map ? setRemoteFavorites([...response?.data?.maps]) : setRemoteFavorites([...response?.data?.visualizations])
                setIsRemoteFavoritesLoading(false)
            } catch (error) {
                setRemoteFavorites([])
                setIsRemoteFavoritesLoading(false)

                toast.error(error?.response?.data?.message || error?.message)
            }
        } else {
            setRemoteFavorites([])
            setIsRemoteFavoritesLoading(false)

            toast.error('All fields are required !')
        }
    }

    const handleFavoritesSaving = async () => {
        setIsCurrentMappingSaving(true)
        if (favoriteConfigs?.hostname && favoriteConfigs?.username && favoriteConfigs?.password && favoriteConfigs?.data) {
            try {
                setIsCurrentMappingSaving(true)
                const route = `${favoriteConfigs.hostname}/api/29/me.json`
                const fav_route = `${API_BASE_ROUTE}/dataStore/${process.env.REACT_APP_DATA_STORE_NAME}/${process.env.REACT_APP_FAVORITES_CONFIG}`
                await axios.get(route, { auth: { username: favoriteConfigs?.username, password: favoriteConfigs?.password } })

                const response = await axios.get(fav_route)
                const favs = [...response.data, { ...favoriteConfigs, password: encryptPassword(favoriteConfigs?.password), id: uuidv4() }]
                await axios.put(fav_route, [...favs])

                loadSavedFavorites()
                setIsCurrentMappingSaving(false)
            } catch (error) {
                setIsCurrentMappingSaving(false)

                toast.error(error?.response?.data?.message || error?.message)
            }
        } else {
            setIsCurrentMappingSaving(false)

            toast.error('All fields are required !')
        }
    }

    const loadTargetDiseases = async () => {
        try {
            const route = `${API_BASE_ROUTE}/optionSets/${process.env.REACT_APP_ALERT_TYPE_DATA_STORE}.json?paging=false&fields=id,name,displayName,code,options[id,name,code,displayName]`
            const response = await axios.get(route)

            setTargetDiseases([...response.data.options])
        } catch (error) {
            toast.error(error?.response?.data?.message || error?.message)
        }
    }

    const [notificationProgramStages, setNotificationProgramStages] = useState([])

    const loadNotificationProgramStages = async e => {
        try {
            setAppSettings({ ...appSettings, notifications_program: e })
            const route = `${API_BASE_ROUTE}/programs/${e?.value}.json?fields=id,name,displayName,programStages[id,name,displayName]`
            const response = await axios.get(route)

            setNotificationProgramStages([...response.data.programStages])
        } catch (error) {
            setNotificationProgramStages([])

            toast.error(error?.response?.data?.message || error?.message)
        }
    }

    const [currentNotificationsDataElements, setCurrentNotificationsDataElements] = useState([])
    const loadDataElementsForSelectedSettingsGroup = async e => {
        try {
            setCurrentNotificationsDataElements([])
            setAppSettings({ ...appSettings, data_element_group: e })
            const route = `${API_BASE_ROUTE}/dataElements.json?paging=false&fields=id,name,displayName&filter=dataElementGroups.id:eq:${e?.value}&order=displayName:ASC`
            const response = await axios.get(route)

            setCurrentNotificationsDataElements([...response.data.dataElements])
        } catch (error) {
            setCurrentNotificationsDataElements([])

            toast.error(error?.response?.data?.message || error?.message)
        }
    }

    const loadTrackerPrograms = async () => {
        try {
            const route = `${API_BASE_ROUTE}/programs.json?filter=programType:eq:WITH_REGISTRATION&filter=name:ne:default&fields=id,name,displayName,programType&order=displayName:ASC&paging=false`
            const response = await axios.get(route)

            setTrackerPrograms([...response.data.programs])
        } catch (error) {
            setTrackerPrograms([])

            toast.error(error?.response?.data?.message || error?.message)
        }
    }

    const loadOptionSets = async () => {
        try {
            const route = `${API_BASE_ROUTE}/optionSets.json?fields=id,name,displayName&paging=false`
            const response = await axios.get(route)

            setCurrentOptionSets([...response.data.optionSets])
        } catch (error) {
            setCurrentOptionSets([])

            toast.error(error?.response?.data?.message || error?.message)
        }
    }

    const loadNotificationsSource = async () => {
        try {
            const route = `${API_BASE_ROUTE}/optionSets/${process.env.REACT_APP_ALERT_SOURCE_DATA_STORE}.json?paging=false&fields=id,name,code,displayName,options[id,name,code,displayName]`
            const response = await axios.get(route)

            setNotificationsSources([...response.data.options])
        } catch (error) {
            toast.error(error?.response?.data?.message)
        }
    }

    const loadNotificationsGravity = async () => {
        try {
            const route = `${API_BASE_ROUTE}/optionSets/${process.env.REACT_APP_ALERT_GRAVITY_DATA_STORE}.json?paging=false&fields=id,name,code,displayName,options[id,name,code,displayName]`
            const response = await axios.get(route)

            setNotificationsGravity([...response.data.options])
        } catch (error) {
            toast.error(error?.response?.data?.message)
        }
    }


    const removeFavoriteConfigRow = id => {
        const ttmpFavoriteConfigs = favorites.filter(f => f.id !== id)
        const route = `${API_BASE_ROUTE}/dataStore/${process.env.REACT_APP_DATA_STORE_NAME}/${process.env.REACT_APP_FAVORITES_CONFIG}`

        axios.put(route, [...ttmpFavoriteConfigs])
            .then(() => {
                setFavorites(ttmpFavoriteConfigs)
                loadSavedFavorites()
            }).catch(error => {
                setCurrentMapping(ttmpFavoriteConfigs)

                toast.error(error?.response?.data?.message)
            })
    }

    const loadSavedFavorites = () => {
        const route = `${API_BASE_ROUTE}/dataStore/${process.env.REACT_APP_DATA_STORE_NAME}/${process.env.REACT_APP_FAVORITES_CONFIG}`

        axios.get(route)
            .then(response => {
                setFavorites(response.data)

            }).catch(error => {
                toast.error(error?.response?.data?.message)
            })
    }

    const closeModal = () => setIsMappingEditionModalVisible(false)

    const [isMappingEditionModalVisible, setIsMappingEditionModalVisible] = useState(false)
    const [isPasswordEncrypted, setIsPasswordEncrypted] = useState(false)
    const [analyticsMetaGroupElements, setAnalyticsMetaGroupElements] = useState([])
    const [generationMetaGroupElements, setGenerationMetaGroupElements] = useState([])

    const handleMappingEdition = () => {
        setIsMappingEditionModalVisible(true)

        setCurrentMapping({ ...initialMapping })
    }

    const loadDataElementsForSelectedGenerationGroup = async e => {
        try {
            setCurrentMapping({ ...currentMapping, generation_meta_group: e })

            setGenerationMetaGroupElements([])
            const dataElementsRoute = `${currentMapping?.hostname}/api/29/dataElements.json?paging=false&fields=id,name,displayName&filter=dataElementGroups.id:eq:${e?.value}&order=displayName:ASC`
            const dataElementsResponse = await axios.get(dataElementsRoute, { auth: { username: currentMapping?.username, password: currentMapping?.password } })
            setGenerationMetaGroupElements([...dataElementsResponse.data.dataElements])
        } catch (error) {
            setGenerationMetaGroupElements([])
        }
    }

    const loadDataElementsForSelectedAnalyticsGroup = async e => {
        try {
            setCurrentMapping({ ...currentMapping, analytics_meta_group: e })

            setAnalyticsMetaGroupElements([])
            const dataElementsRoute = `${currentMapping?.hostname}/api/29/dataElements.json?paging=false&fields=id,name,displayName&filter=dataElementGroups.id:eq:${e?.value}&order=displayName:ASC`
            const dataElementsResponse = await axios.get(dataElementsRoute, { auth: { username: currentMapping?.username, password: currentMapping?.password } })
            setAnalyticsMetaGroupElements([...dataElementsResponse.data.dataElements])
        } catch (error) {
            setAnalyticsMetaGroupElements([])
        }
    }

    const loadIndicatorsForSelectedGroup = async e => {
        try {
            setCurrentMapping({ ...currentMapping, analytics_meta_group: e })

            setAnalyticsMetaGroupElements([])
            const indictorsRoute = `${currentMapping?.hostname}/api/29/indicators.json?paging=false&fields=id,name,displayName&filter=indicatorGroups.id:eq:${e?.value}&order=displayName:ASC`
            const indicatorsResponse = await axios.get(indictorsRoute, { auth: { username: currentMapping?.username, password: currentMapping?.password } })
            setAnalyticsMetaGroupElements([...indicatorsResponse.data.indicators])

        } catch (error) {
            setAnalyticsMetaGroupElements([])
        }
    }

    const loadIndicatorsForSelectedGenerationGroup = async e => {
        try {
            setCurrentMapping({ ...currentMapping, generation_meta_group: e })

            setGenerationMetaGroupElements([])
            const indictorsRoute = `${currentMapping?.hostname}/api/29/indicators.json?paging=false&fields=id,name,displayName&filter=indicatorGroups.id:eq:${e?.value}&order=displayName:ASC`
            const indicatorsResponse = await axios.get(indictorsRoute, { auth: { username: currentMapping?.username, password: currentMapping?.password } })
            setGenerationMetaGroupElements([...indicatorsResponse.data.indicators])

        } catch (error) {
            setGenerationMetaGroupElements([])
        }
    }

    const handleSameOuSelection = e => setCurrentMapping({ ...currentMapping, use_same_ou: e.target.checked, ou_mapping: e.target.checked ? {} : { ...currentMapping?.ou_mapping } })

    const handleOUMapping = (ou, e) => {
        const ou_mapping = currentMapping?.ou_mapping ? { ...currentMapping?.ou_mapping } : {}

        if (e && e?.value) {
            ou_mapping[ou.id] = e?.value
        } else {
            delete ou_mapping[ou?.id]
        }

        setCurrentMapping({ ...currentMapping, ou_mapping })
    }


    const deleteMapping = async id => {
        try {
            const mappings_route = `${API_BASE_ROUTE}/dataStore/${process.env.REACT_APP_DATA_STORE_NAME}/${process.env.REACT_APP_MAPINGS}`
            const mappingsResponse = await axios.get(mappings_route)

            await axios.put(mappings_route, [...mappingsResponse.data].filter(m => m?.id !== id))
            const updatedMappingsResponse = await axios.get(mappings_route)

            setMappings([...updatedMappingsResponse.data])
            setCurrentMapping({ ...initialMapping })

            setIsMappingEditionModalVisible(false)
            toast.success('Operation was successful')
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message)
        }
    }

    const saveAppConfig = async () => {
        if (appSettings?.notifications_source &&
            appSettings?.admin_group &&
            appSettings?.notifications_alerts_or_outbreaks &&
            appSettings?.target_diseases &&
            appSettings?.notifications_program &&
            appSettings?.checking_stage &&
            appSettings?.checking_stage_checking_notes_data_element &&
            appSettings?.checking_stage_result_data_element &&
            appSettings?.data_element_group &&
            appSettings?.risk_evaluation_stage &&
            appSettings?.risk_evaluation_stage_exposure_assessment_data_element &&
            appSettings?.risk_evaluation_stage_hazard_assessment_data_element &&
            appSettings?.risk_evaluation_stage_context_assessment_data_element &&
            appSettings?.risk_characterization_stage &&
            appSettings?.risk_characterization_stage_consequences_data_element &&
            appSettings?.risk_characterization_stage_consequences_comment_data_element &&
            appSettings?.risk_characterization_stage_probability_data_element &&
            appSettings?.risk_characterization_stage_probability_actions_data_element &&
            appSettings?.risk_characterization_stage_probability_comment_data_element &&
            appSettings?.result_stage &&
            appSettings?.result_stage_comments_data_element &&
            appSettings?.result_stage_final_step_data_element
        ) {
            try {
                const app_settings_route = `${API_BASE_ROUTE}/dataStore/${process.env.REACT_APP_DATA_STORE_NAME}/${process.env.REACT_APP_SETTINGS}`
                await axios.put(app_settings_route, { ...appSettings })
                const response = await axios.get(app_settings_route)

                setAppSettings(response.data)
                setIsAppWideConfigsRequired(false)
                toast.success('operation Was Successfull !')
            } catch (error) {
                setIsAppWideConfigsRequired(true)

                toast.error(error?.response?.data?.message || error.message)
            }
        } else {
            toast.error('All fields are required !')
        }
    }

    const [isPopoverOpen, setPopover] = useState(false)

    const onButtonClick = () => setPopover(!isPopoverOpen)

    const closePopover = () => setPopover(false)

    const app_BTN_BTN = (
        <EuiToolTip position="bottom" content="Application Settings">
            <EuiIcon onClick={() => {
                onButtonClick()
            }} type='managementApp' color={displayType === 'Settings' ? 'primary' : 'danger'} size='xl' shape='circle' style={{ cursor: 'pointer' }} />
        </EuiToolTip>
    )

    return (
        <>
            <EuiSpacer size='m' />
            <EuiFlexGroup justifyContent='spaceAround'>
                <EuiFlexItem grow={false}>
                    <EuiTitle size='s'>
                        <div style={{ marging: '30px' }}>
                            <EuiBeacon color='danger' />
                            Alerts and Outbreaks Management
                        </div>
                    </EuiTitle>
                </EuiFlexItem>
            </EuiFlexGroup>

            <EuiSpacer size='m' />

            <EuiFlexGroup justifyContent='spaceAround'>
                <EuiFlexItem grow={false}>
                    <EuiFlexGroup wrap>
                        <EuiFlexItem style={{ padding: '0px', minWidth: '300px', maxWidth: '300px', }}>
                            <OrganisationUnitsTree
                                orgUnits={[...organisationUnits]}
                                parentID={me?.organisationUnits[0]?.id || null}
                                loadingOrganisationUnits={loading}
                                setCurrentOrgUnits={setSelectedOrgUnit} />
                        </EuiFlexItem>

                        <EuiFlexItem >
                            <EuiDatePickerRange
                                isInvalid={startDate > endDate}
                                size='s'
                                fullWidth
                                dateFormat={dateFormat}
                                allowSameDay
                                startDateControl={
                                    <EuiDatePicker
                                        selected={startDate}
                                        onChange={(date) => {
                                            if (date) {
                                                setStartDate(date)
                                                setProgramStartDate(moment(date).format(dateFormat))
                                            }
                                        }}
                                        startDate={startDate}
                                        endDate={endDate}
                                        aria-label="Start date"
                                    />
                                }
                                endDateControl={
                                    <EuiDatePicker
                                        selected={endDate}
                                        onChange={date => {
                                            if (date) {
                                                setProgramEndDate(moment(date).format(dateFormat))
                                                setEndDate(date)
                                            }
                                        }}
                                        startDate={startDate}
                                        endDate={endDate}
                                        aria-label="End date"
                                    />
                                }
                            />
                        </EuiFlexItem>

                        <EuiFlexItem grow={false}>
                            <EuiButton
                                size='m'
                                fill
                                isLoading={isProcessing}
                                onClick={proceedData}>
                                Proceed
                            </EuiButton>
                        </EuiFlexItem>
                    </EuiFlexGroup>
                </EuiFlexItem>
            </EuiFlexGroup>

            <EuiSpacer size='m' />

            <div style={{ paddingLeft: '30px', paddingRight: '30px', }}>
                <EuiFlexGroup>

                    <EuiFlexItem>
                        <EuiPanel hasBorder={true}>
                            <EuiFlexGrid columns={1}>
                                <EuiFlexItem>
                                    <EuiFlexGroup>
                                        <EuiFlexItem>
                                            <EuiStat
                                                style={{ margin: '0px auto', fontSize: '25px', textAlign: 'center' }}
                                                title={countSimpleAggregateData()}
                                                textAlign="left"
                                                isLoading={isProcessing}
                                                titleColor="accent"
                                                description={
                                                    <EuiTextColor color="primary">
                                                        <strong>
                                                            {data.length > 0 ? (countSimpleAggregateData() * 100 / data.length).toFixed(2) : 0}%
                                                        </strong>
                                                    </EuiTextColor>
                                                }
                                            >
                                                <small style={{ fontSize: '12px' }}>
                                                    Alerts
                                                </small>
                                            </EuiStat>
                                        </EuiFlexItem>
                                        <EuiFlexItem>
                                            <EuiStat
                                                style={{ margin: '0px auto', fontSize: '25px', textAlign: 'center' }}
                                                title={countOutbreaksAggregateData()}
                                                textAlign="left"
                                                isLoading={isProcessing}
                                                titleColor="success"
                                                description={
                                                    <EuiTextColor color="primary">
                                                        <strong>
                                                            {data.length > 0 ? (countOutbreaksAggregateData() * 100 / data.length).toFixed(2) : 0}%
                                                        </strong>
                                                    </EuiTextColor>
                                                }
                                            >
                                                <small style={{ fontSize: '12px' }}>
                                                    Outbreaks
                                                </small>
                                            </EuiStat>
                                        </EuiFlexItem>
                                    </EuiFlexGroup>
                                </EuiFlexItem>

                                <EuiFlexItem>
                                    <EuiButtonEmpty
                                        size="xs"
                                        color={'primary'}
                                        onClick={() => { setDashboardType('Aggregate') }}>
                                        Aggregate
                                    </EuiButtonEmpty>
                                </EuiFlexItem>
                            </EuiFlexGrid>
                        </EuiPanel>
                    </EuiFlexItem>

                    <EuiFlexItem>
                        <EuiPanel hasBorder={true}>
                            <EuiFlexGrid columns={1}>
                                <EuiFlexItem>
                                    <EuiFlexGroup>
                                        <EuiFlexItem>
                                            <EuiStat
                                                style={{ margin: '0px auto', fontSize: '25px', textAlign: 'center' }}
                                                title={countSimpleCBSData()}
                                                textAlign="left"
                                                isLoading={isProcessing}
                                                titleColor="accent"
                                                description={
                                                    <EuiTextColor color="primary">
                                                        <strong>
                                                            {data.length > 0 ? (countSimpleCBSData() * 100 / data.length).toFixed(2) : 0}%
                                                        </strong>
                                                    </EuiTextColor>
                                                }  >
                                                <small style={{ fontSize: '12px' }}>
                                                    Alerts
                                                </small>
                                            </EuiStat>
                                        </EuiFlexItem>
                                        <EuiFlexItem>
                                            <EuiStat
                                                style={{ margin: '0px auto', fontSize: '25px', textAlign: 'center' }}
                                                title={countOutbreaksCBSData()}
                                                textAlign="left"
                                                isLoading={isProcessing}
                                                titleColor="success"
                                                description={
                                                    <EuiTextColor color="primary">
                                                        <strong>
                                                            {data.length > 0 ? (countOutbreaksCBSData() * 100 / data.length).toFixed(2) : 0}%
                                                        </strong>
                                                    </EuiTextColor>
                                                }
                                            >
                                                <small style={{ fontSize: '12px' }}>
                                                    Outbreaks
                                                </small>
                                            </EuiStat>
                                        </EuiFlexItem>
                                    </EuiFlexGroup>
                                </EuiFlexItem>
                                <EuiFlexItem>
                                    <EuiButtonEmpty
                                        size="xs"
                                        color={'primary'}
                                        onClick={() => { setDashboardType('CBS') }}>
                                        CBS
                                    </EuiButtonEmpty>
                                </EuiFlexItem>
                            </EuiFlexGrid>
                        </EuiPanel>
                    </EuiFlexItem>

                    <EuiFlexItem>
                        <EuiPanel hasBorder={true}>
                            <EuiFlexGrid columns={1}>
                                <EuiFlexItem>
                                    <EuiStat
                                        style={{ margin: '0px auto', fontSize: '40px', textAlign: 'center' }}
                                        title={countCommunityData()}
                                        textAlign="left"
                                        isLoading={isProcessing}
                                        titleColor="primary"
                                        description={
                                            <EuiTextColor color="primary">
                                                <strong>
                                                    {data.length > 0 ? (countCommunityData() * 100 / data.length).toFixed(2) : 0}%
                                                </strong>
                                            </EuiTextColor>
                                        }
                                    />
                                </EuiFlexItem>

                                <EuiFlexItem>
                                    <EuiButtonEmpty
                                        size="xs"
                                        color={'primary'}
                                        onClick={() => { setDashboardType('Community') }} >
                                        Community
                                    </EuiButtonEmpty>
                                </EuiFlexItem>
                            </EuiFlexGrid>
                        </EuiPanel>
                    </EuiFlexItem>

                    <EuiFlexItem>
                        <EuiPanel hasBorder={true}>
                            <EuiFlexGrid columns={1}>
                                <EuiFlexItem>

                                    <EuiStat
                                        style={{ margin: '0px auto', fontSize: '40px', textAlign: 'center' }}
                                        title={countGrandPublicData()}
                                        textAlign="left"
                                        isLoading={isProcessing}
                                        titleColor="warning"
                                        description={
                                            <EuiTextColor color="primary">
                                                <strong>
                                                    {data.length > 0 ? (countGrandPublicData() * 100 / data.length).toFixed(2) : 0}%
                                                </strong>
                                            </EuiTextColor>
                                        }
                                    />
                                </EuiFlexItem>

                                <EuiFlexItem>
                                    <EuiButtonEmpty
                                        size="xs"
                                        color={'primary'}
                                        onClick={() => { setDashboardType('GrandPublic') }}  >
                                        Grand Public
                                    </EuiButtonEmpty>
                                </EuiFlexItem>
                            </EuiFlexGrid>
                        </EuiPanel>
                    </EuiFlexItem>

                    <EuiFlexItem>
                        <EuiPanel hasBorder={true}>
                            <EuiFlexGrid columns={1}>
                                <EuiFlexItem style={{ textAlign: 'center' }}>
                                    <EuiSpacer size='m' />
                                    <EuiStat
                                        style={{ margin: '0px auto', fontSize: '40px', textAlign: 'center' }}
                                        title={data.length}
                                        textAlign="left"
                                        isLoading={isProcessing}
                                        titleColor="danger"
                                    />
                                </EuiFlexItem>

                                <EuiFlexItem>
                                    <EuiButtonEmpty
                                        size="xs"
                                        color={'primary'}
                                        onClick={() => { setDashboardType('All') }} >
                                        All Notifications
                                    </EuiButtonEmpty>
                                </EuiFlexItem>
                            </EuiFlexGrid>
                        </EuiPanel>
                    </EuiFlexItem>

                </EuiFlexGroup>

                <EuiSpacer />

            </div>

            <EuiSpacer size='m' />

            <div style={{ paddingLeft: '30px', paddingRight: '30px' }}>
                <EuiFlexGroup>
                    <EuiFlexItem>
                        <div style={{ textAlign: 'center', fontSize: '24px' }}>
                            <strong><u>Selected Dashboard</u>:</strong> <span><em>{dashboardType}</em></span>
                        </div>
                    </EuiFlexItem>
                </EuiFlexGroup>
            </div>

            <EuiSpacer size='m' />

            <div style={{ paddingLeft: '30px', paddingRight: '30px' }}>
                <EuiFlexGroup>
                    <EuiFlexItem>
                        <Tabs>
                            <TabList>
                                <Tab>Table View</Tab>
                                <Tab>Map View</Tab>
                                <Tab>Visualizations</Tab>
                                <Tab>Favorites</Tab>
                                {
                                    (me?.authorities.includes('ALL') || me?.userCredentials?.userRoles?.map(role => role?.id)?.includes(appSettings?.admin_group?.value)) && (
                                        <>
                                            <Tab style={{ float: 'right' }}>
                                                <EuiPanel hasBorder>
                                                    <EuiPopover
                                                        id={'contextMenuPopover'}
                                                        button={app_BTN_BTN}
                                                        isOpen={isPopoverOpen}
                                                        closePopover={closePopover}
                                                        panelPaddingSize='none'
                                                        anchorPosition='downLeft' >
                                                        <EuiContextMenu initialPanelId={0} panels={
                                                            [
                                                                {
                                                                    id: 0,
                                                                    title: 'Setting Options Menu',
                                                                    items: [
                                                                        {
                                                                            name: 'Diseases Config',
                                                                            icon: 'document',
                                                                            onClick: () => {
                                                                                closePopover()

                                                                                onChangeCompressed('Settings')
                                                                            },
                                                                        },
                                                                        {
                                                                            name: 'App Config',
                                                                            icon: 'visualizeApp',
                                                                            onClick: () => {
                                                                                closePopover()

                                                                                setIsAppWideConfigsRequired(true)
                                                                            },
                                                                        },
                                                                    ],
                                                                },
                                                            ]
                                                        } />
                                                    </EuiPopover>
                                                </EuiPanel>
                                            </Tab>
                                        </>
                                    )
                                }

                            </TabList>

                            <TabPanel>
                                <>
                                    <EuiFlexItem>
                                        <EuiSpacer size='m' />

                                        <MantineReactTable
                                            columns={[
                                                {
                                                    accessorKey: 'eid',
                                                    header: 'EID',
                                                },
                                                {
                                                    accessorKey: 'alertGravityDetails.displayName',
                                                    header: 'Alert / Outbreak',
                                                },
                                                {
                                                    accessorKey: 'sourceAlertType',
                                                    header: 'Source',
                                                },
                                                {
                                                    accessorKey: 'alertType',
                                                    header: 'Disease',
                                                },
                                                {
                                                    accessorKey: 'trigerredOn',
                                                    header: 'Trigerred On',
                                                },

                                                {
                                                    accessorKey: 'exactLocation',
                                                    header: 'Location',
                                                },
                                                {
                                                    accessorKey: 'alertPeriod',
                                                    header: 'Period',
                                                },
                                                {
                                                    accessorKey: 'location',
                                                    header: 'Location Hierachy',
                                                },
                                                {
                                                    accessorKey: 'locationType',
                                                    header: 'Location Type',
                                                },
                                                {
                                                    accessorKey: 'stageOfStep',
                                                    header: 'Stage of Step',
                                                },
                                                {
                                                    accessorKey: 'step',
                                                    header: 'Step',
                                                },
                                                {
                                                    accessorKey: 'result',
                                                    header: 'Result',
                                                },
                                                {
                                                    accessorKey: 'risk',
                                                    header: 'Risk',
                                                    Cell: ({ cell, row }) => {
                                                        return (
                                                            <div style={{ padding: '0px' }}>
                                                                {
                                                                    cell.getValue() ? (
                                                                        <>
                                                                            <span style={{ margin: '5px', padding: '5px', minHeight: '10px', maxHeight: '10px', minWidth: '10px', maxWidth: '10px', borderRadius: '100%', backgroundColor: getRiskLevelbackgroundColor(row?.original?.consequence, row?.original?.probabilite), }}>
                                                                                &nbsp;
                                                                                &nbsp;
                                                                            </span>
                                                                            <strong>
                                                                                {cell.getValue()}
                                                                            </strong>
                                                                        </>
                                                                    ) : '-'
                                                                }
                                                            </div>
                                                        )
                                                    },
                                                },
                                            ]}
                                            enableColumnOrdering
                                            enableRowActions
                                            enableTopToolbar
                                            mantineTableProps={{
                                                highlightOnHover: true,
                                                withColumnBorders: true,
                                            }}

                                            initialState={{
                                                columnVisibility: {
                                                    alertPeriod: false,
                                                    location: false,
                                                    locationType: false,
                                                    stageOfStep: false,
                                                },
                                                density: 'xs',
                                                showGlobalFilter: false,
                                                sorting: [{ id: 'cellInstanceAPI', desc: false }],
                                            }}

                                            mantinePaperProps={{
                                                shadow: 'lg',
                                            }}

                                            renderRowActions={({ row }) => {
                                                const dataRow = row?.original

                                                return (
                                                    <>
                                                        <EuiToolTip
                                                            position="left"
                                                            content="Click to Show Details"
                                                            display="block">
                                                            <EuiButtonIcon
                                                                iconType='database'
                                                                aria-label='Help'
                                                                color={'primary'}
                                                                onClick={() => {
                                                                    if (dataRow?.stepNo >= 2) {
                                                                        const checkingComment = dataRow?.checkingProgramStageEvent?.dataValues?.find(dataValue => dataValue.dataElement === 'NSZBs9eIWJF')?.value
                                                                        const ccheckingStepResultValue = dataRow?.checkingProgramStageEvent?.dataValues?.find(dataValue => dataValue.dataElement === 'YNpB2DaFwhm')?.value

                                                                        const cstep3CommentValue1 = dataRow?.riskAssessmentProgramStageEvent?.dataValues?.find(dataValue => dataValue.dataElement === 'AKVNiSP1S5n')?.value
                                                                        const cstep3CommentValue2 = dataRow?.riskAssessmentProgramStageEvent?.dataValues?.find(dataValue => dataValue.dataElement === 'Ldo7Qt0s7Kd')?.value
                                                                        const cstep3CommentValue3 = dataRow?.riskAssessmentProgramStageEvent?.dataValues?.find(dataValue => dataValue.dataElement === 'TFfeqM2nioT')?.value

                                                                        setStep3CommentValue1(cstep3CommentValue1)
                                                                        setStep3CommentValue2(cstep3CommentValue2)
                                                                        setStep3CommentValue3(cstep3CommentValue3)

                                                                        setResultStepResultValue(resultStepResultValue)
                                                                        setCheckingStepCommentValue(checkingComment)

                                                                        const resultStepResultoptionsValue = [
                                                                            {
                                                                                label: 'Discard',
                                                                                checked: resultStepResultValue === 'Jetez' ? 'on' : undefined,
                                                                                disabled: false,
                                                                            },
                                                                            {
                                                                                label: 'Monitor',
                                                                                checked: resultStepResultValue === 'Moniteur' ? 'on' : undefined,
                                                                                disabled: false,
                                                                            },
                                                                            {
                                                                                label: 'Response',
                                                                                checked: resultStepResultValue === 'Repondre' ? 'on' : undefined,
                                                                                disabled: false,
                                                                            },
                                                                        ]
                                                                        setResultsStepOptions(resultStepResultoptionsValue)

                                                                        const checkingStepResultoptionsValue = [
                                                                            {
                                                                                label: 'Discard',
                                                                                checked: ccheckingStepResultValue === 'Jetez' ? 'on' : undefined,
                                                                                disabled: false,
                                                                            },
                                                                            {
                                                                                label: 'Monitor',
                                                                                checked: ccheckingStepResultValue === 'Moniteur' ? 'on' : undefined,
                                                                                disabled: false,
                                                                            },
                                                                            {
                                                                                label: `Starting ${RISK_ASSESSMENT_STAGE_NAME}`,
                                                                                checked: ccheckingStepResultValue === 'Debut' ? 'on' : undefined,
                                                                                disabled: false,
                                                                            },
                                                                        ]
                                                                        setCheckingStepOptions(checkingStepResultoptionsValue)
                                                                    }

                                                                    if (dataRow?.stepNo >= 5) {
                                                                        const resultComment = dataRow?.resultProgramStageEvent?.dataValues?.find(dataValue => dataValue.dataElement === 'Zqu3wGr2SM6')?.value
                                                                        const resultStepResultValue = dataRow?.resultProgramStageEvent?.dataValues?.find(dataValue => dataValue.dataElement === 'oJeNyRwYTzu')?.value

                                                                        setResultStepCommentValue(resultComment)
                                                                        setResultStepResultValue(resultStepResultValue)

                                                                        const resultStepResultoptionsValue = [
                                                                            {
                                                                                label: 'Discard',
                                                                                checked: resultStepResultValue === 'Jetez' ? 'on' : undefined,
                                                                                disabled: false,
                                                                            },
                                                                            {
                                                                                label: 'Monitor',
                                                                                checked: resultStepResultValue === 'Moniteur' ? 'on' : undefined,
                                                                                disabled: false,
                                                                            },
                                                                            {
                                                                                label: 'Response',
                                                                                checked: resultStepResultValue === 'Repondre' ? 'on' : undefined,
                                                                                disabled: false,
                                                                            },
                                                                        ]
                                                                        setResultsStepOptions(resultStepResultoptionsValue)
                                                                    }
                                                                    const consequence = dataRow?.riskCharacterizationProgramStageEvent?.dataValues?.find(dataValue => dataValue?.dataElement === 'LyUT3KnXPCh')?.value
                                                                    const probabilite = dataRow?.riskCharacterizationProgramStageEvent?.dataValues?.find(dataValue => dataValue?.dataElement === 'S0JzhLojeos')?.value

                                                                    const cstep4ConsequenceProbability = dataRow?.riskCharacterizationProgramStageEvent?.dataValues?.find(dataValue => dataValue?.dataElement === 'gvPjezVrTNF')?.value
                                                                    const cstep4CommentProbability = dataRow?.riskCharacterizationProgramStageEvent?.dataValues?.find(dataValue => dataValue?.dataElement === 'l72mXq7ADJP')?.value
                                                                    const cstep4ActionProbability = dataRow?.riskCharacterizationProgramStageEvent?.dataValues?.find(dataValue => dataValue?.dataElement === 'FDRfcDfDFb3')?.value

                                                                    consequence && probabilite && setStep4XYValues(consequence, probabilite)
                                                                    dataRow.consequence = consequence
                                                                    dataRow.probabilite = probabilite

                                                                    setStep4ConsequenceProbability(cstep4ConsequenceProbability)
                                                                    setStep4CommentProbability(cstep4CommentProbability)
                                                                    setStep4ActionProbability(cstep4ActionProbability)

                                                                    setStep(dataRow?.stepNo)
                                                                    setIsFlyoutVisible(true)
                                                                    setCurrentDataRow(dataRow)
                                                                }} />
                                                        </EuiToolTip>
                                                    </>
                                                )
                                            }}

                                            data={dataFilter()} />

                                    </EuiFlexItem>
                                </>
                            </TabPanel>

                            <TabPanel>
                                <EuiFlexGroup>
                                    <EuiFlexItem style={{ maxHeight: '400px' }} >
                                        <MapL mapData={{
                                            data: {
                                                features: [...dataFilter().map((d, data_index) => {
                                                    const geometry = { ...d.tei?.enrollments[0]?.events?.find(event => event.programStage === 'mqfA5wgV3U0')?.geometry }

                                                    return {
                                                        properties: {
                                                            id: data_index,
                                                            type: d.alertType,
                                                            source: d.sourceAlertType,
                                                            period: d.alertPeriod,
                                                            triggerredOn: d.trigerredOn,
                                                            location: d.location,
                                                            exactLocation: d.exactLocation,
                                                            locationType: d.locationType,
                                                            step: d.step,
                                                        },
                                                        geometry,
                                                    }
                                                }).filter(d => Object.keys(d.geometry).length > 0)]
                                            }
                                        }} />
                                    </EuiFlexItem>
                                </EuiFlexGroup>
                            </TabPanel>

                            <TabPanel>
                                <>
                                    <EuiFlexGroup>
                                        <EuiFlexItem grow={false} style={{ backgroundColor: '#f7f8fc', border: '1px dotted "dedede' }}>
                                            <div style={{ backgroundColor: '#FFFFFF', padding: '30px', paddingTop: '0px', paddingBottom: '10px', textAlign: 'center' }}>
                                                <EuiTitle size='s'>
                                                    <h6 style={{ color: '#BD271E', margin: '10px' }}>
                                                        Current Selection
                                                    </h6>
                                                </EuiTitle>

                                                <div style={{ backgroundColor: '#f7f8fc' }}>
                                                    <EuiSpacer size='s' />
                                                </div>

                                                <Pie data={
                                                    {
                                                        labels: [ALERT_TRIGERRED, 'Checking', RISK_ASSESSMENT_STAGE_NAME, RISK_CHARACTERIZATION_STAGE_NAME, 'Result'],
                                                        datasets: [
                                                            {
                                                                label: '# of Elements',
                                                                data: [countAlertTrigerredData(), countCheckingData(), countRiskAssessmentData(), countRiskCharacterizationData(), countResultData()],
                                                                backgroundColor: [
                                                                    'rgba(54, 162, 235, 0.2)',
                                                                    'rgba(255, 206, 86, 0.2)',
                                                                    'rgba(75, 192, 192, 0.2)',
                                                                    'rgba(153, 102, 255, 0.2)',
                                                                    'rgba(255, 159, 64, 0.2)',
                                                                ],
                                                                borderColor: [
                                                                    'rgba(54, 162, 235, 1)',
                                                                    'rgba(255, 206, 86, 1)',
                                                                    'rgba(75, 192, 192, 1)',
                                                                    'rgba(153, 102, 255, 1)',
                                                                    'rgba(255, 159, 64, 1)',
                                                                ],
                                                                borderWidth: 1,
                                                            },
                                                        ],
                                                    }
                                                } />
                                            </div>

                                            <EuiSpacer size='s' />

                                            <table style={{ width: '100%', backgroundColor: '#FFFFFF' }} cellPadding={0} cellSpacing={0}>
                                                <thead>
                                                    <th colSpan={2} style={{ textAlign: 'center', border: '1px dotted #dedede', padding: '10px' }}>
                                                        <EuiTitle size='s'>
                                                            <h6 style={{ color: '#BD271E' }}>
                                                                Sumarry
                                                            </h6>
                                                        </EuiTitle>
                                                    </th>
                                                </thead>
                                                <tbody>
                                                    <tr>
                                                        <th style={{ textAlign: 'left', border: '1px dotted #dedede', padding: '10px' }}>
                                                            Alert Trigerred:
                                                        </th>
                                                        <td style={{ textAlign: 'right', border: '1px dotted #dedede', padding: '10px' }}>
                                                            <strong>
                                                                {countAlertTrigerredData()}
                                                            </strong>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <th style={{ textAlign: 'left', border: '1px dotted #dedede', padding: '10px' }}>
                                                            Checking:
                                                        </th>
                                                        <td style={{ textAlign: 'right', border: '1px dotted #dedede', padding: '10px' }}>
                                                            <strong>
                                                                {countCheckingData()}
                                                            </strong>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <th style={{ textAlign: 'left', border: '1px dotted #dedede', padding: '10px' }}>
                                                            {RISK_ASSESSMENT_STAGE_NAME}:
                                                        </th>
                                                        <td style={{ textAlign: 'right', border: '1px dotted #dedede', padding: '10px' }}>
                                                            <strong>
                                                                {countRiskAssessmentData()}
                                                            </strong>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <th style={{ textAlign: 'left', border: '1px dotted #dedede', padding: '10px' }}>
                                                            {RISK_CHARACTERIZATION_STAGE_NAME}:
                                                        </th>
                                                        <td style={{ textAlign: 'right', border: '1px dotted #dedede', padding: '10px' }}>
                                                            <strong>
                                                                {countRiskCharacterizationData()}
                                                            </strong>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <th style={{ textAlign: 'left', border: '1px dotted #dedede', padding: '10px' }}>
                                                            Result:
                                                        </th>
                                                        <td style={{ textAlign: 'right', border: '1px dotted #dedede', padding: '10px' }}>
                                                            <strong>
                                                                {countResultData()}
                                                            </strong>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </EuiFlexItem>

                                        <EuiFlexItem grow={false} style={{ backgroundColor: '#f7f8fc', border: '1px dotted #dedede' }}>
                                            <div style={{ backgroundColor: '#FFFFFF', padding: '30px', paddingTop: '0px', paddingBottom: '10px', textAlign: 'center' }}>
                                                <EuiTitle size='s'>
                                                    <h6 style={{ color: '#BD271E', margin: '10px' }}>
                                                        Risks Stats
                                                    </h6>
                                                </EuiTitle>

                                                <div style={{ backgroundColor: '#f7f8fc' }}>
                                                    <EuiSpacer size='s' />
                                                </div>

                                                <EuiFlexGroup>
                                                    <EuiFlexItem>
                                                        <EuiTitle size='s'>
                                                            <h6 style={{ color: '#BD271E', margin: '10px' }}>
                                                                Alerts
                                                            </h6>
                                                        </EuiTitle>
                                                        <Pie data={
                                                            {
                                                                labels: ['Low Risk', 'Moderate Risk', 'High Risk', 'Very High Risk'],
                                                                datasets: [
                                                                    {
                                                                        label: '# of Elements',
                                                                        data: [
                                                                            countAlertsLowRisk(),
                                                                            countAlertsModerateRisk(),
                                                                            countAlertsHighRisk(),
                                                                            countAlertsVeryHighRisk(),
                                                                        ],
                                                                        backgroundColor: [
                                                                            'rgba(89, 153, 147, 0.2)',
                                                                            'rgba(240, 186, 71, 0.2)',
                                                                            'rgba(224, 120, 85, 0.2)',
                                                                            'rgba(191, 90, 92, 0.2)',
                                                                            'rgba(255, 159, 64, 0.2)',
                                                                        ],
                                                                        borderColor: [
                                                                            'rgba(89, 153, 147, 1)',
                                                                            'rgba(240, 186, 71, 1)',
                                                                            'rgba(224, 120, 85, 1)',
                                                                            'rgba(191, 90, 92, 1)',
                                                                            'rgba(255, 159, 64, 1)',
                                                                        ],
                                                                        borderWidth: 1,
                                                                    },
                                                                ],
                                                            }
                                                        } />
                                                    </EuiFlexItem>
                                                    <EuiFlexItem>
                                                        <EuiTitle size='s'>
                                                            <h6 style={{ color: '#BD271E', margin: '10px' }}>
                                                                Outbreaks
                                                            </h6>
                                                        </EuiTitle>
                                                        <Pie data={
                                                            {
                                                                labels: ['Low Risk', 'Moderate Risk', 'High Risk', 'Very High Risk'],
                                                                datasets: [
                                                                    {
                                                                        label: '# of Elements',
                                                                        data: [
                                                                            countOutbreaksLowRisk(),
                                                                            countOutbreaksModerateRisk(),
                                                                            countOutbreaksHighRisk(),
                                                                            countOutbreaksVeryHighRisk(),
                                                                        ],
                                                                        backgroundColor: [
                                                                            'rgba(89, 153, 147, 0.2)',
                                                                            'rgba(240, 186, 71, 0.2)',
                                                                            'rgba(224, 120, 85, 0.2)',
                                                                            'rgba(191, 90, 92, 0.2)',
                                                                            'rgba(255, 159, 64, 0.2)',
                                                                        ],
                                                                        borderColor: [
                                                                            'rgba(89, 153, 147, 1)',
                                                                            'rgba(240, 186, 71, 1)',
                                                                            'rgba(224, 120, 85, 1)',
                                                                            'rgba(191, 90, 92, 1)',
                                                                            'rgba(255, 159, 64, 1)',
                                                                        ],
                                                                        borderWidth: 1,
                                                                    },
                                                                ],
                                                            }
                                                        } />
                                                    </EuiFlexItem>
                                                </EuiFlexGroup>

                                            </div>

                                            <EuiSpacer size='s' />

                                            <table style={{ width: '100%', backgroundColor: '#FFFFFF' }} cellPadding={0} cellSpacing={0}>
                                                <thead>
                                                    <th colSpan={3} style={{ textAlign: 'center', border: '1px dotted #dedede', padding: '10px' }}>
                                                        <EuiTitle size='s'>
                                                            <h6 style={{ color: '#BD271E' }}>
                                                                Sumarry
                                                            </h6>
                                                        </EuiTitle>
                                                    </th>
                                                </thead>
                                                <tbody>
                                                    <tr>
                                                        <th style={{ textAlign: 'left', border: '1px dotted #dedede', padding: '10px' }}>
                                                            Low Risk:
                                                        </th>
                                                        <td style={{ textAlign: 'right', border: '1px dotted #dedede', padding: '10px' }}>
                                                            <strong style={{ color: 'orange' }}>
                                                                {countAlertsLowRisk()}
                                                            </strong>
                                                        </td>
                                                        <td style={{ textAlign: 'right', border: '1px dotted #dedede', padding: '10px' }}>
                                                            <strong style={{ color: 'red' }}>
                                                                {countOutbreaksLowRisk()}
                                                            </strong>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <th style={{ textAlign: 'left', border: '1px dotted #dedede', padding: '10px' }}>
                                                            Moderate Risk:
                                                        </th>
                                                        <td style={{ textAlign: 'right', border: '1px dotted #dedede', padding: '10px' }}>
                                                            <strong style={{ color: 'orange' }}>
                                                                {countAlertsModerateRisk()}
                                                            </strong>
                                                        </td>
                                                        <td style={{ textAlign: 'right', border: '1px dotted #dedede', padding: '10px' }}>
                                                            <strong style={{ color: 'red' }}>
                                                                {countOutbreaksModerateRisk()}
                                                            </strong>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <th style={{ textAlign: 'left', border: '1px dotted #dedede', padding: '10px' }}>
                                                            High Risk:
                                                        </th>
                                                        <td style={{ textAlign: 'right', border: '1px dotted #dedede', padding: '10px' }}>
                                                            <strong style={{ color: 'orange' }}>
                                                                {countAlertsHighRisk()}
                                                            </strong>
                                                        </td>
                                                        <td style={{ textAlign: 'right', border: '1px dotted #dedede', padding: '10px' }}>
                                                            <strong style={{ color: 'red' }}>
                                                                {countOutbreaksHighRisk()}
                                                            </strong>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <th style={{ textAlign: 'left', border: '1px dotted #dedede', padding: '10px' }}>
                                                            Very High Risk:
                                                        </th>
                                                        <td style={{ textAlign: 'right', border: '1px dotted #dedede', padding: '10px' }}>
                                                            <strong style={{ color: 'orange' }}>
                                                                {countAlertsVeryHighRisk()}
                                                            </strong>
                                                        </td>
                                                        <td style={{ textAlign: 'right', border: '1px dotted #dedede', padding: '10px' }}>
                                                            <strong style={{ color: 'red' }}>
                                                                {countOutbreaksVeryHighRisk()}
                                                            </strong>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </EuiFlexItem>



                                        <EuiFlexItem>
                                            <ReactApexChart
                                                type="treemap"
                                                style={{ width: '600px', height: '400px' }}
                                                options={{
                                                    legend: {
                                                        show: true
                                                    },
                                                    plotOptions: {
                                                        treemap: {
                                                            distributed: false,
                                                        },
                                                        enableShades: true,
                                                        shadeIntensity: 0.5,
                                                    },
                                                    chart: {
                                                        type: 'treemap'
                                                    },
                                                    title: {
                                                        text: 'Alerts and Outbreaks Treemap',
                                                        align: 'center'
                                                    },
                                                    colors: [
                                                        '#5e355f',
                                                        '#ff001f',
                                                    ]
                                                }}
                                                series={[
                                                    {
                                                        name: 'Alerts',
                                                        data: [
                                                            {
                                                                x: 'Aggregate',
                                                                y: countSimpleAggregateData()
                                                            },
                                                            {
                                                                x: 'CBS',
                                                                y: countSimpleCBSData()
                                                            },
                                                            {
                                                                x: 'Community',
                                                                y: countCommunityData()
                                                            },
                                                            {
                                                                x: 'Grand Public',
                                                                y: countGrandPublicData()
                                                            },
                                                        ]
                                                    },
                                                    {
                                                        name: 'Outbreaks',
                                                        data: [
                                                            {
                                                                x: 'Aggregate',
                                                                y: countOutbreaksAggregateData()
                                                            },
                                                            {
                                                                x: 'CBS',
                                                                y: countOutbreaksCBSData()
                                                            },
                                                            {
                                                                x: 'Community',
                                                                y: countOutbreaksCommunityData()
                                                            },
                                                            {
                                                                x: 'Grand Public',
                                                                y: countOutbreaksGrandPublic()
                                                            },
                                                        ]
                                                    },
                                                ]} />
                                        </EuiFlexItem>
                                    </EuiFlexGroup>

                                    <EuiSpacer size='s' />
                                    <EuiFlexGroup>
                                        <EuiFlexItem grow={false} style={{ backgroundColor: '#f7f8fc', border: '1px #dedede dotted' }}>
                                            <div style={{ backgroundColor: '#FFFFFF', padding: '30px', paddingTop: '0px', paddingBottom: '10px', textAlign: 'center' }}>
                                                <EuiTitle size='s'>
                                                    <h6 style={{ color: '#BD271E', margin: '10px' }}>
                                                        Global Stats
                                                    </h6>
                                                </EuiTitle>

                                                <div style={{ backgroundColor: '#f7f8fc' }}>
                                                    <EuiSpacer size='s' />
                                                </div>

                                                <Pie data={
                                                    {
                                                        labels: ['Aggregate', 'CBS', 'Community', 'Grand Public'],
                                                        datasets: [
                                                            {
                                                                label: '# of Elements',
                                                                data: [countAggregateData(), countCBSData(), countCommunityData(), countGrandPublicData()],
                                                                backgroundColor: [
                                                                    'rgba(54, 162, 235, 0.2)',
                                                                    'rgba(255, 206, 86, 0.2)',
                                                                    'rgba(75, 192, 192, 0.2)',
                                                                    'rgba(153, 102, 255, 0.2)',
                                                                    'rgba(255, 159, 64, 0.2)',
                                                                ],
                                                                borderColor: [
                                                                    'rgba(54, 162, 235, 1)',
                                                                    'rgba(255, 206, 86, 1)',
                                                                    'rgba(75, 192, 192, 1)',
                                                                    'rgba(153, 102, 255, 1)',
                                                                    'rgba(255, 159, 64, 1)',
                                                                ],
                                                                borderWidth: 1,
                                                            },
                                                        ],
                                                    }
                                                } />
                                            </div>

                                            <EuiSpacer size='s' />

                                            <table style={{ width: '100%', backgroundColor: '#FFFFFF' }} cellPadding={0} cellSpacing={0}>
                                                <thead>
                                                    <th colSpan={2} style={{ textAlign: 'center', border: '1px dotted #dedede', padding: '10px' }}>
                                                        <EuiTitle size='s'>
                                                            <h6 style={{ color: '#BD271E' }}>
                                                                Sumarry
                                                            </h6>
                                                        </EuiTitle>
                                                    </th>
                                                </thead>
                                                <tbody>
                                                    <tr>
                                                        <th style={{ textAlign: 'left', border: '1px dotted #dedede', padding: '10px' }}>
                                                            Aggregate:
                                                        </th>
                                                        <td style={{ textAlign: 'right', border: '1px dotted #dedede', padding: '10px' }}>
                                                            <strong>
                                                                {countAggregateData()}
                                                            </strong>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <th style={{ textAlign: 'left', border: '1px dotted #dedede', padding: '10px' }}>
                                                            CBS:
                                                        </th>
                                                        <td style={{ textAlign: 'right', border: '1px dotted #dedede', padding: '10px' }}>
                                                            <strong>
                                                                {countCBSData()}
                                                            </strong>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <th style={{ textAlign: 'left', border: '1px dotted #dedede', padding: '10px' }}>
                                                            Community:
                                                        </th>
                                                        <td style={{ textAlign: 'right', border: '1px dotted #dedede', padding: '10px' }}>
                                                            <strong>
                                                                {countCommunityData()}
                                                            </strong>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <th style={{ textAlign: 'left', border: '1px dotted #dedede', padding: '10px' }}>
                                                            Grand Public:
                                                        </th>
                                                        <td style={{ textAlign: 'right', border: '1px dotted #dedede', padding: '10px' }}>
                                                            <strong>
                                                                {countGrandPublicData()}
                                                            </strong>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </EuiFlexItem>

                                        <EuiFlexItem grow={false} style={{ backgroundColor: '#f7f8fc', border: '1px dotted #dedede' }}>
                                            <div style={{ backgroundColor: '#FFFFFF', padding: '30px', paddingTop: '0px', paddingBottom: '10px', textAlign: 'center' }}>
                                                <EuiTitle size='s'>
                                                    <h6 style={{ color: '#BD271E', margin: '10px' }}>
                                                        Investigation Status
                                                    </h6>
                                                </EuiTitle>

                                                <div style={{ backgroundColor: '#f7f8fc' }}>
                                                    <EuiSpacer size='s' />
                                                </div>

                                                <EuiFlexGroup>
                                                    <EuiFlexItem>
                                                        <EuiTitle size='s'>
                                                            <h6 style={{ color: '#BD271E', margin: '10px' }}>
                                                                Alerts
                                                            </h6>
                                                        </EuiTitle>
                                                        <Pie data={
                                                            {
                                                                labels: ['Investigated', 'Confirmed', 'Cancelled'],
                                                                datasets: [
                                                                    {
                                                                        borderWidth: 1,
                                                                        label: '# of Elements',
                                                                        data: [countInvestigatedAlertsData(), countConfirmedAlertsData(), countCancelledAlertsData()],
                                                                        backgroundColor: [
                                                                            'rgba(89, 153, 147, 0.2)',
                                                                            'rgba(54, 162, 235, 0.2)',
                                                                            'rgba(120, 0, 0, 0.2)',
                                                                            'rgba(255, 159, 64, 0.2)',
                                                                        ],
                                                                        borderColor: [
                                                                            'rgba(89, 153, 147, 1)',
                                                                            'rgba(54, 162, 235, 1)',
                                                                            'rgba(120, 0, 0, 1)',
                                                                            'rgba(255, 159, 64, 1)',
                                                                        ],
                                                                    },
                                                                ],
                                                            }
                                                        } />
                                                    </EuiFlexItem>
                                                    <EuiFlexItem>
                                                        <EuiTitle size='s'>
                                                            <h6 style={{ color: '#BD271E', margin: '10px' }}>
                                                                Outbreaks
                                                            </h6>
                                                        </EuiTitle>
                                                        <Pie data={
                                                            {
                                                                labels: ['Investigated', 'Confirmed', 'Cancelled'],
                                                                datasets: [
                                                                    {
                                                                        label: '# of Elements',
                                                                        data: [countInvestigatedOutbreaksData(), countConfirmedOutbreaksData(), countCancelledOutbreaksData()],
                                                                        backgroundColor: [
                                                                            'rgba(89, 153, 147, 0.2)',
                                                                            'rgba(54, 162, 235, 0.2)',
                                                                            'rgba(120, 0, 0, 0.2)',
                                                                            'rgba(255, 159, 64, 0.2)',
                                                                        ],
                                                                        borderColor: [
                                                                            'rgba(89, 153, 147, 1)',
                                                                            'rgba(54, 162, 235, 1)',
                                                                            'rgba(120, 0, 0, 1)',
                                                                            'rgba(255, 159, 64, 1)',
                                                                        ],
                                                                        borderWidth: 1,
                                                                    },
                                                                ],
                                                            }
                                                        } />
                                                    </EuiFlexItem>
                                                </EuiFlexGroup>

                                            </div>

                                            <EuiSpacer size='s' />

                                            <table style={{ width: '100%', backgroundColor: '#FFFFFF' }} cellPadding={0} cellSpacing={0}>
                                                <thead>
                                                    <th colSpan={3} style={{ textAlign: 'center', border: '1px dotted #dedede', padding: '10px' }}>
                                                        <EuiTitle size='s'>
                                                            <h6 style={{ color: '#BD271E' }}>
                                                                Sumarry
                                                            </h6>
                                                        </EuiTitle>
                                                    </th>
                                                </thead>
                                                <tbody>
                                                    <tr>
                                                        <th style={{ textAlign: 'left', border: '1px dotted #dedede', padding: '10px' }}>
                                                            Cases Investigated:
                                                        </th>
                                                        <td style={{ textAlign: 'right', border: '1px dotted #dedede', padding: '10px' }}>
                                                            <strong style={{ color: 'orange' }}>
                                                                {countInvestigatedAlertsData()}
                                                            </strong>
                                                        </td>
                                                        <td style={{ textAlign: 'right', border: '1px dotted #dedede', padding: '10px' }}>
                                                            <strong style={{ color: 'red' }}>
                                                                {countInvestigatedOutbreaksData()}
                                                            </strong>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <th style={{ textAlign: 'left', border: '1px dotted #dedede', padding: '10px' }}>
                                                            Cases Confirmed:
                                                        </th>
                                                        <td style={{ textAlign: 'right', border: '1px dotted #dedede', padding: '10px' }}>
                                                            <strong style={{ color: 'orange' }}>
                                                                {countConfirmedAlertsData()}
                                                            </strong>
                                                        </td>
                                                        <td style={{ textAlign: 'right', border: '1px dotted #dedede', padding: '10px' }}>
                                                            <strong style={{ color: 'red' }}>
                                                                {countConfirmedOutbreaksData()}
                                                            </strong>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <th style={{ textAlign: 'left', border: '1px dotted #dedede', padding: '10px' }}>
                                                            Cases Cancelled:
                                                        </th>
                                                        <td style={{ textAlign: 'right', border: '1px dotted #dedede', padding: '10px' }}>
                                                            <strong style={{ color: 'orange' }}>
                                                                {countCancelledAlertsData()}
                                                            </strong>
                                                        </td>
                                                        <td style={{ textAlign: 'right', border: '1px dotted #dedede', padding: '10px' }}>
                                                            <strong style={{ color: 'red' }}>
                                                                {countCancelledOutbreaksData()}
                                                            </strong>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </EuiFlexItem>
                                    </EuiFlexGroup>

                                    <EuiSpacer size='m' />
                                </>
                            </TabPanel>

                            <TabPanel>
                                {favorites.length === 0 && (
                                    <EuiFlexGroup justifyContent='spaceAround'>
                                        <EuiFlexItem grow={false} style={{ fontSize: '20px', fontWeight: 'bold', margin: '20px auto' }}>
                                            No favorite available Yet
                                        </EuiFlexItem>
                                    </EuiFlexGroup>
                                )}

                                {
                                    favorites.length > 0 && (
                                        <>
                                            <EuiFlexGrid columns={1}>
                                                {favorites.map(e => (
                                                    <EuiFlexItem grow={false} key={uuidv4()}>
                                                        <EuiText grow={false} style={{ fontSize: '18px', fontWeight: 'bold' }}>
                                                            {e?.data?.label}
                                                        </EuiText>

                                                        <EuiSpacer />

                                                        <Visualization
                                                            type={e?.is_map ? VISUALIZATION_TYPE.MAP : null}
                                                            id={e?.data?.id}
                                                            baseUrl={e?.hostname}
                                                            username={e?.username}
                                                            password={decryptPassword(e?.password)}
                                                        />
                                                    </EuiFlexItem>
                                                ))}
                                            </EuiFlexGrid>
                                        </>
                                    )
                                }
                            </TabPanel>

                            {
                                (me?.authorities.includes('ALL') || me?.userCredentials?.userRoles?.map(role => role?.id)?.includes(appSettings?.admin_group?.value)) && (
                                    <>
                                        <TabPanel style={{ marginTop: '30px' }}>
                                            {
                                                displayType === 'Settings' && (
                                                    <EuiFlexItem>
                                                        <Tabs>
                                                            <TabList>
                                                                <Tab >Diseases Configuration</Tab>
                                                                <Tab>Remote Favorites</Tab>
                                                            </TabList>

                                                            {
                                                                isMappingEditionModalVisible && (
                                                                    <>
                                                                        <EuiModal onClose={closeModal} initialFocus="[name=popswitch]" style={{ minWidth: window.innerWidth - 800 }}  >
                                                                            <EuiModalHeader style={{ backgroundColor: '#dedede' }}>
                                                                                <EuiModalHeaderTitle>
                                                                                    <EuiText grow={false} style={{ fontSize: '20px', fontWeight: 'bold' }}>
                                                                                        Edit Configuration
                                                                                    </EuiText>
                                                                                </EuiModalHeaderTitle>
                                                                            </EuiModalHeader>

                                                                            <EuiModalBody>
                                                                                <EuiSpacer size='s' />

                                                                                <EuiCard hasShadow hasBorder style={{ backgroundColor: '#dedede' }}>
                                                                                    <EuiFlexGroup>
                                                                                        <EuiFlexItem>
                                                                                            <EuiFormControlLayout >
                                                                                                <EuiFieldText
                                                                                                    type="url"
                                                                                                    controlOnly
                                                                                                    size='s'
                                                                                                    value={currentMapping?.hostname}
                                                                                                    onChange={e => setCurrentMapping({ ...currentMapping, hostname: e?.target?.value })}
                                                                                                    placeholder='hostname'
                                                                                                    aria-label={uuidv4()} />
                                                                                            </EuiFormControlLayout>
                                                                                        </EuiFlexItem>

                                                                                        <EuiFlexItem>
                                                                                            <EuiFormControlLayout >
                                                                                                <EuiFieldText
                                                                                                    type="text"
                                                                                                    placeholder='username'
                                                                                                    controlOnly
                                                                                                    size='s'
                                                                                                    value={currentMapping?.username}
                                                                                                    onChange={e => setCurrentMapping({ ...currentMapping, username: e?.target?.value })}
                                                                                                    aria-label={uuidv4()} />
                                                                                            </EuiFormControlLayout>
                                                                                        </EuiFlexItem>

                                                                                        <EuiFlexItem>
                                                                                            <EuiFormControlLayout>
                                                                                                <EuiFieldPassword
                                                                                                    placeholder='password'
                                                                                                    controlOnly
                                                                                                    size='s'
                                                                                                    type={'dual'}
                                                                                                    onChange={e => {
                                                                                                        setIsPasswordEncrypted(false)

                                                                                                        setCurrentMapping({ ...currentMapping, password: e?.target?.value })
                                                                                                    }}
                                                                                                    aria-label={uuidv4()} />
                                                                                            </EuiFormControlLayout>
                                                                                        </EuiFlexItem>

                                                                                        <EuiFlexItem grow={false}>
                                                                                            <EuiButton
                                                                                                fill
                                                                                                // size='s'
                                                                                                isLoading={issaveCurrentMappingLoading}
                                                                                                onClick={() => connectToRemoteInstance()} >
                                                                                                Connect
                                                                                            </EuiButton>
                                                                                        </EuiFlexItem>
                                                                                    </EuiFlexGroup>
                                                                                </EuiCard>

                                                                                <EuiSpacer size='s' />

                                                                                <EuiFlexGroup>
                                                                                    <EuiFlexItem>
                                                                                        <EuiText style={{ color: '#07C', textAlign: 'left', }}>
                                                                                            Alert / Outbreak
                                                                                        </EuiText>

                                                                                        <Select
                                                                                            styles={{ container: base => ({ ...base, textAlign: 'left', }) }}
                                                                                            isSearchable
                                                                                            value={currentMapping?.alert_or_outbreak}
                                                                                            onChange={e => setCurrentMapping({ ...currentMapping, alert_or_outbreak: e })}
                                                                                            options={[...notificationsGravity.map(e => ({
                                                                                                code: e.code,
                                                                                                label: e.displayName,
                                                                                                value: e.id,
                                                                                            }))]}
                                                                                        />
                                                                                    </EuiFlexItem>
                                                                                    <EuiFlexItem>
                                                                                        <EuiText style={{ color: '#07C', textAlign: 'left', }}>
                                                                                            Source
                                                                                        </EuiText>

                                                                                        <Select
                                                                                            styles={{ container: base => ({ ...base, textAlign: 'left', }) }}
                                                                                            isSearchable
                                                                                            value={currentMapping?.source}
                                                                                            onChange={e => setCurrentMapping({ ...currentMapping, source: e })}
                                                                                            options={[...notificationsSources.map(e => ({
                                                                                                code: e.code,
                                                                                                label: e?.displayName,
                                                                                                value: e?.id,
                                                                                            }))]}
                                                                                        />
                                                                                    </EuiFlexItem>

                                                                                    <EuiFlexItem>
                                                                                        <EuiText style={{ color: '#07C', textAlign: 'left', }}>
                                                                                            Target Disease
                                                                                        </EuiText>

                                                                                        <Select
                                                                                            styles={{ container: base => ({ ...base, textAlign: 'left', }) }}
                                                                                            isSearchable
                                                                                            value={currentMapping?.target_disease}
                                                                                            onChange={e => setCurrentMapping({ ...currentMapping, target_disease: e })}
                                                                                            options={[...targetDiseases.map(e => ({
                                                                                                label: e.displayName,
                                                                                                value: e.id,
                                                                                                code: e.code,
                                                                                            }))]}
                                                                                        />
                                                                                    </EuiFlexItem>
                                                                                </EuiFlexGroup>

                                                                                <EuiSpacer size='s' />

                                                                                <EuiFlexGroup>
                                                                                    <EuiFlexItem>
                                                                                        <EuiText style={{ color: '#07C', textAlign: 'left', }}>
                                                                                            Source Metadata Group
                                                                                        </EuiText>

                                                                                        <Select
                                                                                            styles={{ container: base => ({ ...base, textAlign: 'left', }) }}
                                                                                            isSearchable
                                                                                            value={selectboxOptions.find(e => e.value === currentMapping?.analytics_group)}
                                                                                            onChange={e => setCurrentMapping({ ...currentMapping, analytics_group: e.value })}
                                                                                            options={[...selectboxOptions]} />
                                                                                    </EuiFlexItem>

                                                                                    {
                                                                                        currentMapping?.analytics_group === DATA_ELEMENTS_GROUP && (
                                                                                            <>
                                                                                                <EuiFlexItem>
                                                                                                    <>
                                                                                                        <EuiText style={{ color: '#07C', textAlign: 'left', }}>
                                                                                                            Data Element Group
                                                                                                        </EuiText>

                                                                                                        <Select
                                                                                                            styles={{ container: base => ({ ...base, textAlign: 'left', }) }}
                                                                                                            isSearchable
                                                                                                            value={{ ...currentMapping?.analytics_meta_group }}
                                                                                                            onChange={e => loadDataElementsForSelectedAnalyticsGroup(e)}
                                                                                                            options={[
                                                                                                                ...remoteDataElementGroups.map(group => (
                                                                                                                    {
                                                                                                                        label: group?.displayName,
                                                                                                                        value: group?.id,
                                                                                                                    }))
                                                                                                            ]} />
                                                                                                    </>
                                                                                                </EuiFlexItem>

                                                                                                <EuiFlexItem>
                                                                                                    <>
                                                                                                        <EuiText style={{ color: '#07C', textAlign: 'left', }}>
                                                                                                            Data Element
                                                                                                        </EuiText>

                                                                                                        <Select
                                                                                                            styles={{ container: base => ({ ...base, textAlign: 'left', }) }}
                                                                                                            isSearchable
                                                                                                            value={currentMapping?.analytics_group === DATA_ELEMENTS_GROUP ? { ...currentMapping?.analytics_metadata } : null}
                                                                                                            onChange={e => setCurrentMapping({ ...currentMapping, analytics_metadata: e })}
                                                                                                            options={[...analyticsMetaGroupElements.map(e => ({
                                                                                                                label: e.displayName,
                                                                                                                value: e.id,
                                                                                                            }))]}
                                                                                                        />
                                                                                                    </>
                                                                                                </EuiFlexItem>
                                                                                            </>
                                                                                        )
                                                                                    }

                                                                                    {
                                                                                        currentMapping?.analytics_group === INDICATORS_GROUP && (
                                                                                            <>
                                                                                                <EuiFlexItem>
                                                                                                    <>
                                                                                                        <EuiText style={{ color: '#07C', textAlign: 'left', }}>
                                                                                                            Indicators Group
                                                                                                        </EuiText>

                                                                                                        <Select
                                                                                                            styles={{ container: base => ({ ...base, textAlign: 'left', }) }}
                                                                                                            isSearchable
                                                                                                            value={{ ...currentMapping?.analytics_meta_group }}
                                                                                                            onChange={e => loadIndicatorsForSelectedGroup(e)}
                                                                                                            options={[...remoteIndicatorGroups.map(group => (
                                                                                                                {
                                                                                                                    label: group?.displayName,
                                                                                                                    value: group?.id,
                                                                                                                }
                                                                                                            ))]} />
                                                                                                    </>
                                                                                                </EuiFlexItem>

                                                                                                <EuiFlexItem>
                                                                                                    <>
                                                                                                        <EuiText style={{ color: '#07C', textAlign: 'left', }}>
                                                                                                            Indicator
                                                                                                        </EuiText>

                                                                                                        <Select
                                                                                                            styles={{ container: base => ({ ...base, textAlign: 'left', }) }}
                                                                                                            isSearchable
                                                                                                            value={currentMapping?.analytics_metadata}
                                                                                                            onChange={e => setCurrentMapping({ ...currentMapping, analytics_metadata: e })}
                                                                                                            options={[...analyticsMetaGroupElements.map(e => ({
                                                                                                                label: e.displayName,
                                                                                                                value: e.id,
                                                                                                            }))]}
                                                                                                        />
                                                                                                    </>
                                                                                                </EuiFlexItem>
                                                                                            </>
                                                                                        )
                                                                                    }
                                                                                </EuiFlexGroup>

                                                                                <EuiSpacer size='s' />

                                                                                <EuiFlexGroup>
                                                                                    <EuiFlexItem>
                                                                                        <EuiText style={{ color: '#07C', textAlign: 'left', }}>
                                                                                            Metada for details data
                                                                                        </EuiText>

                                                                                        <Select
                                                                                            styles={{ container: base => ({ ...base, textAlign: 'left', }) }}
                                                                                            isSearchable
                                                                                            value={selectboxOptions.find(e => e.value === currentMapping?.generation_group)}
                                                                                            onChange={e => setCurrentMapping({ ...currentMapping, generation_group: e.value })}
                                                                                            options={[...selectboxOptions]} />
                                                                                    </EuiFlexItem>

                                                                                    {
                                                                                        currentMapping?.generation_group === DATA_ELEMENTS_GROUP && (
                                                                                            <>
                                                                                                <EuiFlexItem>
                                                                                                    <>
                                                                                                        <EuiText style={{ color: '#07C', textAlign: 'left', }}>
                                                                                                            Data Element Group
                                                                                                        </EuiText>

                                                                                                        <Select
                                                                                                            styles={{ container: base => ({ ...base, textAlign: 'left', }) }}
                                                                                                            isSearchable
                                                                                                            value={currentMapping?.generation_meta_group}
                                                                                                            onChange={e => loadDataElementsForSelectedGenerationGroup(e)}
                                                                                                            options={[...remoteDataElementGroups.map(group => (
                                                                                                                {
                                                                                                                    label: group?.displayName,
                                                                                                                    value: group?.id,
                                                                                                                }
                                                                                                            ))
                                                                                                            ]}
                                                                                                        />
                                                                                                    </>
                                                                                                </EuiFlexItem>

                                                                                                <EuiFlexItem>
                                                                                                    <>
                                                                                                        <EuiText style={{ color: '#07C', textAlign: 'left', }}>
                                                                                                            Data Element
                                                                                                        </EuiText>

                                                                                                        <Select
                                                                                                            styles={{ container: base => ({ ...base, textAlign: 'left', }) }}
                                                                                                            isSearchable
                                                                                                            value={currentMapping?.generation_metadata}
                                                                                                            onChange={e => setCurrentMapping({ ...currentMapping, generation_metadata: e })}
                                                                                                            options={[...generationMetaGroupElements.map(e => (
                                                                                                                {
                                                                                                                    label: e?.displayName,
                                                                                                                    value: e?.id,
                                                                                                                }
                                                                                                            ))]}
                                                                                                        />
                                                                                                    </>
                                                                                                </EuiFlexItem>
                                                                                            </>
                                                                                        )
                                                                                    }

                                                                                    {
                                                                                        currentMapping?.generation_group === INDICATORS_GROUP && (
                                                                                            <>
                                                                                                <EuiFlexItem>
                                                                                                    <>
                                                                                                        <EuiText style={{ color: '#07C', textAlign: 'left', }}>
                                                                                                            Indicators Group
                                                                                                        </EuiText>

                                                                                                        <Select
                                                                                                            styles={{ container: base => ({ ...base, textAlign: 'left', }) }}
                                                                                                            isSearchable
                                                                                                            value={currentMapping?.generation_meta_group}
                                                                                                            onChange={e => loadIndicatorsForSelectedGenerationGroup(e)}
                                                                                                            options={[...remoteIndicatorGroups.map(group => (
                                                                                                                {
                                                                                                                    label: group?.displayName,
                                                                                                                    value: group?.id,
                                                                                                                }
                                                                                                            ))]}
                                                                                                        />
                                                                                                    </>
                                                                                                </EuiFlexItem>

                                                                                                <EuiFlexItem>
                                                                                                    <>
                                                                                                        <EuiText style={{ color: '#07C', textAlign: 'left', }}>
                                                                                                            Indicator
                                                                                                        </EuiText>

                                                                                                        <Select
                                                                                                            styles={{ container: base => ({ ...base, textAlign: 'left', }) }}
                                                                                                            isSearchable
                                                                                                            onChange={e => setCurrentMapping({ ...currentMapping, generation_metadata: e })}
                                                                                                            value={currentMapping?.generation_metadata}
                                                                                                            options={[...generationMetaGroupElements.map(e => ({
                                                                                                                label: e.displayName,
                                                                                                                value: e.id,
                                                                                                            }))]}
                                                                                                        />
                                                                                                    </>
                                                                                                </EuiFlexItem>
                                                                                            </>
                                                                                        )
                                                                                    }
                                                                                </EuiFlexGroup>

                                                                                <EuiSpacer size='s' />
                                                                                <EuiFlexGroup>
                                                                                    <EuiFlexItem>
                                                                                        <EuiText style={{ color: '#07C', textAlign: 'left', }}>
                                                                                            Coordinates Generation Strategy
                                                                                        </EuiText>
                                                                                        <Radio.Group onChange={e => setCurrentMapping({ ...currentMapping, coordinates_strategy: e?.target?.value })} value={currentMapping?.coordinates_strategy}>
                                                                                            <Space direction="vertical">
                                                                                                <Radio value={GENERATE_COORDINATES}>Generate Coordinates</Radio>
                                                                                                <Radio value={USE_ORG_UNIT_COORDINATES}>Use Org unit Coordinates</Radio>
                                                                                                <Radio value={IGNORE_COORDINATES}>Ignore Coordinates Generation</Radio>
                                                                                            </Space>
                                                                                        </Radio.Group>
                                                                                    </EuiFlexItem>

                                                                                    {
                                                                                        currentMapping?.coordinates_strategy === GENERATE_COORDINATES && (
                                                                                            <>
                                                                                                <EuiFlexItem>
                                                                                                    <EuiText style={{ color: '#07C', textAlign: 'left', }}>
                                                                                                        Distance from Center
                                                                                                    </EuiText>
                                                                                                    <InputNumber style={{ float: 'right', textAlign: 'right', width: '100%' }} placeholder='distance' value={currentMapping?.coordinates_distance} onChange={e => setCurrentMapping({ ...currentMapping, coordinates_distance: e })} />
                                                                                                </EuiFlexItem>
                                                                                            </>
                                                                                        )
                                                                                    }
                                                                                </EuiFlexGroup>

                                                                                <EuiSpacer size='s' />

                                                                                <EuiFlexGroup justifyContent='spaceBetween'>
                                                                                    <EuiFlexItem >
                                                                                        <EuiText style={{ color: '#07C', textAlign: 'left', }}>
                                                                                            Metadata Data Loading Period
                                                                                        </EuiText>
                                                                                        <Select
                                                                                            styles={{ container: base => ({ ...base, textAlign: 'left', }) }}
                                                                                            isSearchable
                                                                                            value={currentMapping?.data_loading_period}
                                                                                            onChange={e => setCurrentMapping({ ...currentMapping, data_loading_period: e })}
                                                                                            options={[...data_loading_options]} />
                                                                                    </EuiFlexItem>

                                                                                    <EuiFlexItem >
                                                                                        <EuiText style={{ color: '#07C', textAlign: 'left', }}>
                                                                                            Backend Execution Period
                                                                                        </EuiText>
                                                                                        <Select
                                                                                            styles={{ container: base => ({ ...base, textAlign: 'left', }) }}
                                                                                            isSearchable
                                                                                            value={currentMapping?.execution_period}
                                                                                            onChange={e => setCurrentMapping({ ...currentMapping, execution_period: e })}
                                                                                            options={[
                                                                                                {
                                                                                                    label: 'LAST_WEEK',
                                                                                                    value: 'LAST_WEEK',
                                                                                                },
                                                                                                {
                                                                                                    label: 'LAST_52_WEEKS',
                                                                                                    value: 'LAST_52_WEEKS',
                                                                                                },
                                                                                                {
                                                                                                    label: 'WEEKS_THIS_YEAR',
                                                                                                    value: 'WEEKS_THIS_YEAR',
                                                                                                },
                                                                                            ]} />
                                                                                    </EuiFlexItem>
                                                                                </EuiFlexGroup>

                                                                                <EuiSpacer size='s' />

                                                                                <EuiFlexGroup justifyContent='spaceBetween'>
                                                                                    <EuiFlexItem grow={false}>
                                                                                        <EuiSwitch
                                                                                            label='Use the Same Organisation Units'
                                                                                            checked={currentMapping?.use_same_ou}
                                                                                            onChange={e => handleSameOuSelection(e)} />
                                                                                    </EuiFlexItem>
                                                                                </EuiFlexGroup>

                                                                                <EuiSpacer size='s' />

                                                                                {
                                                                                    currentMapping && Object.keys(currentMapping)?.includes('use_same_ou') && !currentMapping?.use_same_ou && (
                                                                                        <>
                                                                                            <EuiFlexGroup>
                                                                                                <EuiFlexItem>
                                                                                                    <EuiText style={{ color: '#07C', textAlign: 'left', }}>
                                                                                                        Source/Remote Instance Ou Level
                                                                                                    </EuiText>

                                                                                                    <Select
                                                                                                        styles={{ container: base => ({ ...base, textAlign: 'left', }) }}
                                                                                                        isSearchable
                                                                                                        onChange={e => setRemoteSelectedOULevel(e?.level)}

                                                                                                        options={[...remoteOrganisationUnitLevels.map(ouLevel => ({
                                                                                                            ...ouLevel,
                                                                                                            label: ouLevel.displayName,
                                                                                                            value: ouLevel.id,
                                                                                                        }))]} />
                                                                                                </EuiFlexItem>

                                                                                                <EuiFlexItem>
                                                                                                    <EuiText style={{ color: '#07C', textAlign: 'left', }}>
                                                                                                        Destination/Current Instance Ou Level
                                                                                                    </EuiText>

                                                                                                    <Select
                                                                                                        styles={{ container: base => ({ ...base, textAlign: 'left', }) }}
                                                                                                        isSearchable
                                                                                                        onChange={e => setCurrentSelectedOULevel(e?.level)}
                                                                                                        options={[...currentOrganisationUnitLevels.map(ouLevel => ({
                                                                                                            ...ouLevel,
                                                                                                            label: ouLevel.displayName,
                                                                                                            value: ouLevel?.id,
                                                                                                        }))]} />
                                                                                                </EuiFlexItem>
                                                                                            </EuiFlexGroup>

                                                                                            {
                                                                                                currentSelectedOULevel && remoteSelectedOULevel &&
                                                                                                remoteOrganisationUnits.filter(ou => ou?.level === remoteSelectedOULevel)?.length > 0 &&
                                                                                                organisationUnits.filter(ou => ou?.level === currentSelectedOULevel)?.length && (
                                                                                                    <>
                                                                                                        <EuiSpacer size='s' />

                                                                                                        <EuiFlexGroup>
                                                                                                            <EuiFlexItem>
                                                                                                                {
                                                                                                                    remoteOrganisationUnits.filter(ou => ou?.level === remoteSelectedOULevel).map(ou => (
                                                                                                                        <EuiFlexGroup key={ou?.id}>
                                                                                                                            <EuiFlexItem>
                                                                                                                                <EuiSpacer size='s' />
                                                                                                                                <EuiText style={{ color: '#07C', textAlign: 'left', }}>
                                                                                                                                    Source/Remote Organisation Units
                                                                                                                                </EuiText>
                                                                                                                                <Select
                                                                                                                                    isDisabled
                                                                                                                                    styles={{ container: base => ({ ...base, textAlign: 'left', }) }}
                                                                                                                                    value={{
                                                                                                                                        label: ou?.displayName,
                                                                                                                                        value: ou?.id,
                                                                                                                                    }}
                                                                                                                                    options={[...remoteOrganisationUnits.filter(ou => ou?.level === remoteSelectedOULevel).map(ou => ({
                                                                                                                                        label: ou.displayName,
                                                                                                                                        value: ou.id,
                                                                                                                                    }))]} />
                                                                                                                            </EuiFlexItem>

                                                                                                                            <EuiFlexItem>
                                                                                                                                <EuiSpacer size='s' />
                                                                                                                                <EuiText style={{ color: '#07C', textAlign: 'left', }}>
                                                                                                                                    Destination/Current Organisation Units
                                                                                                                                </EuiText>
                                                                                                                                <Select
                                                                                                                                    isDisabled={currentOrganisationUnitLevels.length === 0 || remoteOrganisationUnitLevels.length === 0 || organisationUnits.length === 0}
                                                                                                                                    styles={{ container: base => ({ ...base, textAlign: 'left', }) }}
                                                                                                                                    isSearchable
                                                                                                                                    isClearable
                                                                                                                                    value={organisationUnits.find(o => o.id === currentMapping?.ou_mapping[ou?.id]) ? {
                                                                                                                                        ...organisationUnits.find(o => o.id === currentMapping?.ou_mapping[ou?.id]),
                                                                                                                                        label: organisationUnits.find(o => o.id === currentMapping?.ou_mapping[ou?.id])?.displayName,
                                                                                                                                        value: organisationUnits.find(o => o.id === currentMapping?.ou_mapping[ou?.id])?.id,
                                                                                                                                    } : null}
                                                                                                                                    onChange={e => handleOUMapping(ou, e)}
                                                                                                                                    options={[...organisationUnits.filter(ou => ou?.level === currentSelectedOULevel).map(ou => ({
                                                                                                                                        ...ou,
                                                                                                                                        label: ou?.displayName,
                                                                                                                                        value: ou?.id,
                                                                                                                                    }))]} />
                                                                                                                            </EuiFlexItem>
                                                                                                                        </EuiFlexGroup>
                                                                                                                    ))
                                                                                                                }
                                                                                                            </EuiFlexItem>

                                                                                                        </EuiFlexGroup>
                                                                                                    </>
                                                                                                )
                                                                                            }
                                                                                        </>
                                                                                    )
                                                                                }

                                                                                <EuiSpacer size='m' />
                                                                            </EuiModalBody>

                                                                            <EuiModalFooter style={{ backgroundColor: '#dedede' }}>
                                                                                <EuiFlexGroup justifyContent='spaceBetween'>
                                                                                    <EuiFlexItem grow={false}>
                                                                                        <EuiButton
                                                                                            size="s"
                                                                                            fill
                                                                                            isLoading={isSavingMappings}
                                                                                            onClick={() => saveMapping()}  >
                                                                                            Save Current Mapping
                                                                                        </EuiButton>
                                                                                    </EuiFlexItem>

                                                                                    <EuiFlexItem grow={false}>
                                                                                        <EuiSpacer size='s' />
                                                                                        <EuiSwitch
                                                                                            label='Display on Dashboard'
                                                                                            checked={currentMapping?.display_on_dashboard}
                                                                                            onChange={e => setCurrentMapping({ ...currentMapping, display_on_dashboard: e.target.checked })} />
                                                                                    </EuiFlexItem>
                                                                                </EuiFlexGroup>
                                                                            </EuiModalFooter>
                                                                        </EuiModal>
                                                                    </>
                                                                )
                                                            }

                                                            <TabPanel>
                                                                <EuiSpacer size='s' />

                                                                <EuiFlexGroup wrap>
                                                                    <EuiFlexItem grow={false}>
                                                                        <EuiButton size='s' fill onClick={() => handleMappingEdition()} >
                                                                            <EuiIcon type="plus" size="xl" /> New Configuration
                                                                        </EuiButton>
                                                                    </EuiFlexItem>
                                                                </EuiFlexGroup>

                                                                <EuiSpacer size='s' />

                                                                <MantineReactTable
                                                                    enableColumnOrdering
                                                                    enableRowActions
                                                                    enableTopToolbar
                                                                    mantineTableProps={{
                                                                        highlightOnHover: true,
                                                                        withColumnBorders: true,
                                                                    }}

                                                                    mantinePaperProps={{
                                                                        shadow: 'lg',
                                                                    }}

                                                                    columns={[
                                                                        {
                                                                            accessorKey: 'alert_or_outbreak.label',
                                                                            header: 'Alert/Outbreak',
                                                                        },
                                                                        {
                                                                            accessorKey: 'source.label',
                                                                            header: 'Source',
                                                                        },
                                                                        {
                                                                            accessorKey: 'target_disease.label',
                                                                            header: 'Disease',
                                                                        },
                                                                        {
                                                                            accessorKey: 'analytics_metadata.label',
                                                                            header: 'Analytics Meta',
                                                                        },
                                                                        {
                                                                            accessorKey: 'generation_metadata.label',
                                                                            header: 'Generation Meta',
                                                                        },
                                                                    ]}

                                                                    renderRowActions={({ row }) => (
                                                                        <div>
                                                                            <EuiToolTip position="bottom" content="Delete">
                                                                                <Popconfirm
                                                                                    placement="bottom"
                                                                                    title={'Do you really want to remove this mapping ?'}
                                                                                    description={'Mapping Deletion'}
                                                                                    onConfirm={() => deleteMapping(row?.original?.id)}
                                                                                    okText='Confirm'
                                                                                    cancelText='Cancel'>
                                                                                    <FaTrash style={{ color: 'red', fontSize: '15px', margin: '5px', cursor: 'pointer' }} />
                                                                                </Popconfirm>
                                                                            </EuiToolTip>

                                                                            <EuiToolTip
                                                                                position="bottom"
                                                                                content="Edit" >
                                                                                <FaRegEdit title onClick={() => {
                                                                                    setCurrentMapping(row.original)
                                                                                    setIsMappingEditionModalVisible(true)
                                                                                }} style={{ color: 'darkblue', fontSize: '15px', margin: '5px', cursor: 'pointer' }} />
                                                                            </EuiToolTip>
                                                                        </div>
                                                                    )}

                                                                    data={[...mappings]} />
                                                            </TabPanel>

                                                            <TabPanel>
                                                                <EuiSpacer size='m' />
                                                                Favorite Tab
                                                                <EuiCard hasBorder>
                                                                    <>
                                                                        <EuiFlexGroup >
                                                                            <EuiFlexItem>
                                                                                <EuiText style={{ color: '#07C', textAlign: 'left', }}>
                                                                                    Hostname
                                                                                </EuiText>
                                                                                <EuiFormControlLayout >
                                                                                    <EuiFieldText
                                                                                        type="url"
                                                                                        controlOnly
                                                                                        value={favoriteConfigs?.hostname}
                                                                                        onChange={e => setFavoriteConfigs({ ...favoriteConfigs, hostname: e?.target?.value })}
                                                                                        placeholder='hostname'
                                                                                        aria-label={uuidv4()} />
                                                                                </EuiFormControlLayout>
                                                                            </EuiFlexItem>
                                                                            <EuiFlexItem>
                                                                                <EuiText style={{ color: '#07C', textAlign: 'left', }}>
                                                                                    Username
                                                                                </EuiText>
                                                                                <EuiFormControlLayout >
                                                                                    <EuiFieldText
                                                                                        type="text"
                                                                                        placeholder='username'
                                                                                        controlOnly
                                                                                        value={favoriteConfigs?.username}
                                                                                        onChange={e => setFavoriteConfigs({ ...favoriteConfigs, username: e?.target?.value })}
                                                                                        aria-label={uuidv4()} />
                                                                                </EuiFormControlLayout>
                                                                            </EuiFlexItem>

                                                                            <EuiFlexItem>
                                                                                <EuiText style={{ color: '#07C', textAlign: 'left', }}>
                                                                                    Password
                                                                                </EuiText>
                                                                                <EuiFormControlLayout>
                                                                                    <EuiFieldPassword
                                                                                        placeholder='password'
                                                                                        controlOnly
                                                                                        type={'dual'}
                                                                                        onChange={e => setFavoriteConfigs({ ...favoriteConfigs, password: e?.target?.value })}
                                                                                        value={favoriteConfigs?.password}
                                                                                        aria-label={uuidv4()} />
                                                                                </EuiFormControlLayout>
                                                                            </EuiFlexItem>

                                                                            <EuiFlexItem grow={false}>
                                                                                <EuiSpacer size='m' />
                                                                                <EuiSpacer size='m' />
                                                                                <EuiFormRow>
                                                                                    <EuiSwitch
                                                                                        label={'Load Maps Favorite'}
                                                                                        checked={favoriteConfigs?.is_map}
                                                                                        onChange={e => setFavoriteConfigs({ ...favoriteConfigs, is_map: e?.target?.checked })} />
                                                                                </EuiFormRow>
                                                                            </EuiFlexItem>

                                                                            <EuiFlexItem grow={false}>
                                                                                <EuiSpacer size='m' />
                                                                                <EuiSpacer size='m' />

                                                                                <EuiButton
                                                                                    size='s'
                                                                                    fill
                                                                                    isLoading={isRemoteFavoritesLoading}
                                                                                    onClick={() => loadRemoteFavorites()} >
                                                                                    Connect
                                                                                </EuiButton>
                                                                            </EuiFlexItem>
                                                                        </EuiFlexGroup>

                                                                        <EuiSpacer size='s' />

                                                                        <EuiFlexGroup justifyContent='spaceBetween'>
                                                                            <EuiFlexItem style={{ maxWidth: '600px' }}>
                                                                                <EuiText style={{ color: '#07C', textAlign: 'left', }}>
                                                                                    Remote Resources
                                                                                </EuiText>

                                                                                <Select
                                                                                    styles={{ container: base => ({ ...base, textAlign: 'left', }) }}
                                                                                    isSearchable
                                                                                    onChange={e => setFavoriteConfigs({ ...favoriteConfigs, data: e })}
                                                                                    options={[...remoteFavorites.map(e => ({
                                                                                        ...e,
                                                                                        label: e?.displayName,
                                                                                        value: e?.id,
                                                                                    }))]}
                                                                                />
                                                                            </EuiFlexItem>

                                                                            <EuiFlexItem grow={false}>
                                                                                <EuiSpacer size='m' />
                                                                                <EuiSpacer size='m' />

                                                                                <EuiButton
                                                                                    size="s"
                                                                                    fill
                                                                                    isLoading={issaveCurrentMappingLoading}
                                                                                    onClick={() => handleFavoritesSaving()}>
                                                                                    Save Favorite Config
                                                                                </EuiButton>
                                                                            </EuiFlexItem>
                                                                        </EuiFlexGroup>

                                                                        <EuiSpacer size='s' />
                                                                    </>
                                                                </EuiCard>

                                                                <EuiSpacer size='m' />
                                                                <EuiSpacer size='m' />

                                                                <MantineReactTable
                                                                    enableColumnOrdering
                                                                    enableRowActions
                                                                    enableTopToolbar
                                                                    mantineTableProps={{
                                                                        highlightOnHover: true,
                                                                        withColumnBorders: true,
                                                                    }}

                                                                    mantinePaperProps={{
                                                                        shadow: 'lg',
                                                                    }}

                                                                    columns={[
                                                                        {
                                                                            accessorKey: 'data.label',
                                                                            header: 'Favorite',
                                                                        },
                                                                        {
                                                                            accessorKey: 'hostname',
                                                                            header: 'Instance',
                                                                        },
                                                                        {
                                                                            accessorKey: 'username',
                                                                            header: 'Username',
                                                                        },
                                                                    ]}

                                                                    renderRowActions={({ row }) => (
                                                                        <div>
                                                                            <Popconfirm
                                                                                placement="left"
                                                                                title={'Do you really want to remove this config ?'}
                                                                                description={'Delete Configuration'}
                                                                                onConfirm={() => removeFavoriteConfigRow(row?.original?.id)}
                                                                                okText='Delete Anyway'
                                                                                cancelText='Cancel Deletion' >
                                                                                <Button type="primary" size='small' danger>
                                                                                    Remove
                                                                                </Button>
                                                                            </Popconfirm>
                                                                        </div>
                                                                    )}

                                                                    data={[...favorites]} />
                                                            </TabPanel>
                                                        </Tabs>
                                                    </EuiFlexItem>
                                                )
                                            }
                                        </TabPanel>
                                    </>
                                )
                            }


                        </Tabs>
                    </EuiFlexItem>
                </EuiFlexGroup>
            </div>
            <EuiSpacer size='m' />

            {
                isFlyoutVisible && currentDataRow && currentDataRow?.stepNo && (
                    <>
                        <Spin tip='Processing ..' size='large'>
                            <EuiFlyout
                                ownFocus
                                size={'l'}
                                aria-labelledby={titleID}
                                onClose={() => { closePane() }} >
                                <EuiFlyoutHeader hasBorder>
                                    <EuiFlexGroup justifyContent='spaceBetween' style={{ backgroundColor: '#f2f2f2', padding: '10px' }}>
                                        <EuiFlexItem grow={false}>
                                            <div className='col'>
                                                <EuiTitle size='s'>
                                                    <div style={{ fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase', color: '#0077cc' }} id={titleID}>
                                                        <strong>
                                                            {`${currentDataRow?.sourceAlertType} - ${currentDataRow?.alertType} - ${currentDataRow?.alertGravityDetails?.displayName}`}
                                                        </strong>
                                                    </div>
                                                </EuiTitle>
                                                <hr />
                                                <EuiSpacer size='s' />

                                                <EuiText>
                                                    <div style={{ fontSize: '12px', fontWeight: 'normal' }}>
                                                        <strong>EID:</strong> {currentDataRow?.eid}
                                                    </div>
                                                    <div style={{ fontSize: '12px', fontWeight: 'normal' }}>
                                                        <strong>Period:</strong> {currentDataRow?.alertPeriod} &nbsp;&nbsp; <strong>Triggered:</strong> {currentDataRow?.trigerredOn}
                                                    </div>
                                                    <div style={{ fontSize: '12px', fontWeight: 'normal' }}>
                                                        <strong>Location:</strong> {currentDataRow?.location}
                                                    </div>
                                                    <div style={{ fontSize: '12px', fontWeight: 'normal' }}>
                                                        <strong>Exact Location:</strong> {currentDataRow?.exactLocation}
                                                    </div>
                                                </EuiText>

                                                <EuiSpacer size='s' />
                                            </div>
                                        </EuiFlexItem>

                                        <EuiFlexItem grow={false}>
                                            <div style={{ backgroundColor: 'transparent' }}>
                                                <table style={{ backgroundColor: '#FFFFFF', width: '300px', padding: '10px' }}>
                                                    <tbody>
                                                        <tr>
                                                            <td style={{ textAlign: 'right', border: '1px #e3e7e9 solid', padding: '10px' }}>
                                                                <strong>
                                                                    Risk Level:
                                                                </strong>
                                                            </td>
                                                            <td style={{ border: '1px #e3e7e9 solid', padding: '10px', backgroundColor: getRiskLevelbackgroundColor(currentDataRow?.consequence, currentDataRow?.probabilite), color: '#FFFFFF' }}>
                                                                <strong>
                                                                    {getRiskLevelCaption(currentDataRow?.consequence, currentDataRow?.probabilite)}
                                                                </strong>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td style={{ textAlign: 'right', border: '1px #e3e7e9 solid', padding: '10px' }}>
                                                                <strong>
                                                                    Step:
                                                                </strong>
                                                            </td>
                                                            <td style={{ border: '1px #e3e7e9 solid', padding: '10px' }}>
                                                                <u>{currentDataRow?.stageOfStep}</u>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td style={{ textAlign: 'right', border: '1px #e3e7e9 solid', padding: '10px' }}>
                                                                <strong>
                                                                    Result:
                                                                </strong>
                                                            </td>
                                                            <td style={{ border: '1px #e3e7e9 solid', padding: '10px' }}>
                                                                {optionSetTranslator(currentDataRow?.result)}
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </EuiFlexItem>
                                    </EuiFlexGroup>
                                </EuiFlyoutHeader>

                                <EuiFlyoutBody>
                                    <Fragment>
                                        <EuiTabbedContent
                                            tabs={tabs}
                                            initialSelectedTab={tabs[0]}
                                            autoFocus="selected" />
                                    </Fragment>
                                </EuiFlyoutBody>
                            </EuiFlyout>
                        </Spin>
                    </>
                )
            }

            {
                isAppWideConfigsRequired && (
                    <>
                        <EuiModal style={{ minWidth: 1200, minHeight: 800, }} onClose={() => toast.error('You should save the config please !')} >
                            <EuiModalHeader style={{ backgroundColor: '#dedede' }}>
                                <EuiModalHeaderTitle>
                                    <EuiText grow={false} style={{ fontSize: '20px', fontWeight: 'bold' }}>
                                        App Config
                                    </EuiText>
                                </EuiModalHeaderTitle>
                            </EuiModalHeader>

                            <EuiModalBody>
                                <EuiSpacer size='s' />
                                <EuiFlexGroup>
                                    <EuiFlexItem>
                                        <EuiText style={{ color: '#07C', textAlign: 'left', }}>
                                            App Admin User Role
                                        </EuiText>

                                        <Select
                                            styles={{ container: base => ({ ...base, textAlign: 'left', }) }}
                                            isSearchable
                                            value={appSettings?.admin_group}
                                            onChange={e => setAppSettings({ ...appSettings, admin_group: e })}
                                            options={[...userRoles.map(e => ({
                                                ...e,
                                                label: e.displayName,
                                                value: e.id,
                                            }))]}
                                        />
                                    </EuiFlexItem>
                                </EuiFlexGroup>

                                <EuiFlexGroup>
                                    <EuiFlexItem>
                                        <EuiText style={{ color: '#07C', textAlign: 'left', }}>
                                            Source
                                        </EuiText>

                                        <Select
                                            styles={{ container: base => ({ ...base, textAlign: 'left', }) }}
                                            isSearchable
                                            value={appSettings?.notifications_source}
                                            onChange={e => setAppSettings({ ...appSettings, notifications_source: e })}
                                            options={[...currentOptionSets.map(e => ({
                                                ...e,
                                                label: e.displayName,
                                                value: e.id,
                                            }))]}
                                        />
                                    </EuiFlexItem>

                                    <EuiFlexItem>
                                        <EuiText style={{ color: '#07C', textAlign: 'left', }}>
                                            Alert/Outbreak
                                        </EuiText>

                                        <Select
                                            styles={{ container: base => ({ ...base, textAlign: 'left', }) }}
                                            isSearchable
                                            value={appSettings?.notifications_alerts_or_outbreaks}
                                            onChange={e => setAppSettings({ ...appSettings, notifications_alerts_or_outbreaks: e })}
                                            options={[...currentOptionSets.map(e => ({
                                                ...e,
                                                label: e.displayName,
                                                value: e.id,
                                            }))]}
                                        />
                                    </EuiFlexItem>

                                    <EuiFlexItem>
                                        <EuiText style={{ color: '#07C', textAlign: 'left', }}>
                                            Target Disease
                                        </EuiText>

                                        <Select
                                            styles={{ container: base => ({ ...base, textAlign: 'left', }) }}
                                            isSearchable
                                            value={appSettings?.target_diseases}
                                            onChange={e => setAppSettings({ ...appSettings, target_diseases: e })}
                                            options={[...currentOptionSets.map(e => ({
                                                ...e,
                                                label: e.displayName,
                                                value: e.id,
                                            }))]}
                                        />
                                    </EuiFlexItem>
                                </EuiFlexGroup>

                                <EuiSpacer size='m' />
                                <hr />
                                <EuiSpacer size='m' />
                                <EuiSpacer size='m' />

                                <EuiFlexGroup>
                                    <EuiFlexItem>
                                        <EuiText style={{ color: '#07C', textAlign: 'left', }}>
                                            Notifications Program
                                        </EuiText>

                                        <Select
                                            styles={{ container: base => ({ ...base, textAlign: 'left', }) }}
                                            isSearchable
                                            value={appSettings?.notifications_program}
                                            onChange={e => loadNotificationProgramStages(e)}
                                            options={[...trackerPrograms.map(e => ({
                                                ...e,
                                                label: e.displayName,
                                                value: e.id,
                                            }))]}
                                        />
                                    </EuiFlexItem>
                                    <EuiFlexItem>
                                        <EuiText style={{ color: '#07C', textAlign: 'left', }}>
                                            Data Element Group
                                        </EuiText>

                                        <Select
                                            styles={{ container: base => ({ ...base, textAlign: 'left', }) }}
                                            isSearchable
                                            value={appSettings?.data_element_group}
                                            onChange={e => loadDataElementsForSelectedSettingsGroup(e)}
                                            options={[...currentDataElementGroups.map(e => ({
                                                ...e,
                                                label: e.displayName,
                                                value: e.id,
                                            }))]}
                                        />
                                    </EuiFlexItem>
                                </EuiFlexGroup>

                                <EuiSpacer size='m' />
                                <hr />
                                <EuiSpacer size='m' />
                                <EuiSpacer size='m' />

                                <EuiFlexGroup>
                                    <EuiFlexItem>
                                        <EuiText style={{ color: '#07C', textAlign: 'left', }}>
                                            Checking
                                        </EuiText>
                                    </EuiFlexItem>

                                    <EuiFlexItem>
                                        <Select
                                            styles={{ container: base => ({ ...base, textAlign: 'left', }) }}
                                            isSearchable
                                            value={appSettings?.checking_stage}
                                            onChange={e => setAppSettings({ ...appSettings, checking_stage: e })}
                                            options={[...notificationProgramStages.map(e => ({
                                                ...e,
                                                label: e.displayName,
                                                value: e.id,
                                            }))]}
                                        />
                                    </EuiFlexItem>
                                </EuiFlexGroup>

                                <EuiSpacer size='s' />

                                <EuiFlexGroup>
                                    <EuiFlexItem>
                                        <EuiText style={{ color: '#000000', textAlign: 'left', }}>
                                            Checking Notes
                                        </EuiText>

                                        <EuiSpacer size='s' />

                                        <Select
                                            styles={{ container: base => ({ ...base, textAlign: 'left', }) }}
                                            isSearchable
                                            value={appSettings?.checking_stage_checking_notes_data_element}
                                            onChange={e => setAppSettings({ ...appSettings, checking_stage_checking_notes_data_element: e })}
                                            options={[...currentNotificationsDataElements.map(e => ({
                                                ...e,
                                                label: e.displayName,
                                                value: e.id,
                                            }))]}
                                        />
                                    </EuiFlexItem>
                                    <EuiFlexItem>
                                        <EuiText style={{ color: '#000000', textAlign: 'left', }}>
                                            Result
                                        </EuiText>

                                        <EuiSpacer size='s' />

                                        <Select
                                            styles={{ container: base => ({ ...base, textAlign: 'left', }) }}
                                            isSearchable
                                            value={appSettings?.checking_stage_result_data_element}
                                            onChange={e => setAppSettings({ ...appSettings, checking_stage_result_data_element: e })}
                                            options={[...currentNotificationsDataElements.map(e => ({
                                                ...e,
                                                label: e.displayName,
                                                value: e.id,
                                            }))]}
                                        />
                                    </EuiFlexItem>
                                </EuiFlexGroup>

                                <EuiSpacer size='m' />
                                <hr />
                                <EuiSpacer size='m' />
                                <EuiSpacer size='m' />

                                <EuiFlexGroup>
                                    <EuiFlexItem>
                                        <EuiText style={{ color: '#07C', textAlign: 'left', }}>
                                            Risk Evaluation
                                        </EuiText>
                                    </EuiFlexItem>

                                    <EuiFlexItem>
                                        <Select
                                            styles={{ container: base => ({ ...base, textAlign: 'left', }) }}
                                            isSearchable
                                            value={appSettings?.risk_evaluation_stage}
                                            onChange={e => setAppSettings({ ...appSettings, risk_evaluation_stage: e })}
                                            options={[...notificationProgramStages.map(e => ({
                                                ...e,
                                                label: e.displayName,
                                                value: e.id,
                                            }))]}
                                        />
                                    </EuiFlexItem>
                                </EuiFlexGroup>
                                <EuiSpacer size='s' />

                                <EuiFlexGroup>
                                    <EuiFlexItem>
                                        <EuiText style={{ color: '#000000', textAlign: 'left', }}>
                                            Exposure Assessment
                                        </EuiText>

                                        <EuiSpacer size='s' />

                                        <Select
                                            styles={{ container: base => ({ ...base, textAlign: 'left', }) }}
                                            isSearchable
                                            value={appSettings?.risk_evaluation_stage_exposure_assessment_data_element}
                                            onChange={e => setAppSettings({ ...appSettings, risk_evaluation_stage_exposure_assessment_data_element: e })}
                                            options={[...currentNotificationsDataElements.map(e => ({
                                                ...e,
                                                label: e.displayName,
                                                value: e.id,
                                            }))]}
                                        />
                                    </EuiFlexItem>
                                    <EuiFlexItem>
                                        <EuiText style={{ color: '#000000', textAlign: 'left', }}>
                                            Hazard Assessment
                                        </EuiText>

                                        <EuiSpacer size='s' />

                                        <Select
                                            styles={{ container: base => ({ ...base, textAlign: 'left', }) }}
                                            isSearchable
                                            value={appSettings?.risk_evaluation_stage_hazard_assessment_data_element}
                                            onChange={e => setAppSettings({ ...appSettings, risk_evaluation_stage_hazard_assessment_data_element: e })}
                                            options={[...currentNotificationsDataElements.map(e => ({
                                                ...e,
                                                label: e.displayName,
                                                value: e.id,
                                            }))]}
                                        />
                                    </EuiFlexItem>
                                    <EuiFlexItem>
                                        <EuiText style={{ color: '#000000', textAlign: 'left', }}>
                                            Context Assessment
                                        </EuiText>

                                        <EuiSpacer size='s' />

                                        <Select
                                            styles={{ container: base => ({ ...base, textAlign: 'left', }) }}
                                            isSearchable
                                            value={appSettings?.risk_evaluation_stage_context_assessment_data_element}
                                            onChange={e => setAppSettings({ ...appSettings, risk_evaluation_stage_context_assessment_data_element: e })}
                                            options={[...currentNotificationsDataElements.map(e => ({
                                                ...e,
                                                label: e.displayName,
                                                value: e.id,
                                            }))]} />
                                    </EuiFlexItem>
                                </EuiFlexGroup>

                                <EuiSpacer size='m' />
                                <hr />
                                <EuiSpacer size='m' />
                                <EuiSpacer size='m' />

                                <EuiFlexGroup>
                                    <EuiFlexItem>
                                        <EuiText style={{ color: '#07C', textAlign: 'left', }}>
                                            {RISK_CHARACTERIZATION_STAGE_NAME}
                                        </EuiText>
                                    </EuiFlexItem>

                                    <EuiFlexItem>
                                        <Select
                                            styles={{ container: base => ({ ...base, textAlign: 'left', }) }}
                                            isSearchable
                                            value={appSettings?.risk_characterization_stage}
                                            onChange={e => setAppSettings({ ...appSettings, risk_characterization_stage: e })}
                                            options={[...notificationProgramStages.map(e => ({
                                                ...e,
                                                label: e.displayName,
                                                value: e.id,
                                            }))]}
                                        />
                                    </EuiFlexItem>
                                </EuiFlexGroup>

                                <EuiSpacer size='s' />

                                <EuiFlexGroup>
                                    <EuiFlexItem>
                                        <EuiText style={{ color: '#000000', textAlign: 'left', }}>
                                            Consequences
                                        </EuiText>

                                        <EuiSpacer size='s' />

                                        <Select
                                            styles={{ container: base => ({ ...base, textAlign: 'left', }) }}
                                            isSearchable
                                            value={appSettings?.risk_characterization_stage_consequences_data_element}
                                            onChange={e => setAppSettings({ ...appSettings, risk_characterization_stage_consequences_data_element: e })}
                                            options={[...currentNotificationsDataElements.map(e => ({
                                                ...e,
                                                label: e.displayName,
                                                value: e.id,
                                            }))]}
                                        />
                                    </EuiFlexItem>
                                    <EuiFlexItem>
                                        <EuiText style={{ color: '#000000', textAlign: 'left', }}>
                                            Consequences Comment
                                        </EuiText>

                                        <EuiSpacer size='s' />

                                        <Select
                                            styles={{ container: base => ({ ...base, textAlign: 'left', }) }}
                                            isSearchable
                                            value={appSettings?.risk_characterization_stage_consequences_comment_data_element}
                                            onChange={e => setAppSettings({ ...appSettings, risk_characterization_stage_consequences_comment_data_element: e })}
                                            options={[...currentNotificationsDataElements.map(e => ({
                                                ...e,
                                                label: e.displayName,
                                                value: e.id,
                                            }))]}
                                        />
                                    </EuiFlexItem>
                                    <EuiFlexItem>
                                        <EuiText style={{ color: '#000000', textAlign: 'left', }}>
                                            Probability
                                        </EuiText>

                                        <EuiSpacer size='s' />

                                        <Select
                                            styles={{ container: base => ({ ...base, textAlign: 'left', }) }}
                                            isSearchable
                                            value={appSettings?.risk_characterization_stage_probability_data_element}
                                            onChange={e => setAppSettings({ ...appSettings, risk_characterization_stage_probability_data_element: e })}
                                            options={[...currentNotificationsDataElements.map(e => ({
                                                ...e,
                                                label: e.displayName,
                                                value: e.id,
                                            }))]}
                                        />
                                    </EuiFlexItem>
                                    <EuiFlexItem>
                                        <EuiText style={{ color: '#000000', textAlign: 'left', }}>
                                            Probability Actions
                                        </EuiText>

                                        <EuiSpacer size='s' />

                                        <Select
                                            styles={{ container: base => ({ ...base, textAlign: 'left', }) }}
                                            isSearchable
                                            value={appSettings?.risk_characterization_stage_probability_actions_data_element}
                                            onChange={e => setAppSettings({ ...appSettings, risk_characterization_stage_probability_actions_data_element: e })}
                                            options={[...currentNotificationsDataElements.map(e => ({
                                                ...e,
                                                label: e.displayName,
                                                value: e.id,
                                            }))]}
                                        />
                                    </EuiFlexItem>
                                    <EuiFlexItem>
                                        <EuiText style={{ color: '#000000', textAlign: 'left', }}>
                                            Probability Comment
                                        </EuiText>

                                        <EuiSpacer size='s' />

                                        <Select
                                            styles={{ container: base => ({ ...base, textAlign: 'left', }) }}
                                            isSearchable
                                            value={appSettings?.risk_characterization_stage_probability_comment_data_element}
                                            onChange={e => setAppSettings({ ...appSettings, risk_characterization_stage_probability_comment_data_element: e })}
                                            options={[...currentNotificationsDataElements.map(e => ({
                                                ...e,
                                                label: e.displayName,
                                                value: e.id,
                                            }))]}
                                        />
                                    </EuiFlexItem>
                                </EuiFlexGroup>

                                <EuiSpacer size='m' />
                                <hr />
                                <EuiSpacer size='m' />
                                <EuiSpacer size='m' />

                                <EuiFlexGroup>
                                    <EuiFlexItem>
                                        <EuiText style={{ color: '#07C', textAlign: 'left', }}>
                                            Result
                                        </EuiText>
                                    </EuiFlexItem>

                                    <EuiFlexItem>
                                        <Select
                                            styles={{ container: base => ({ ...base, textAlign: 'left', }) }}
                                            isSearchable
                                            value={appSettings?.result_stage}
                                            onChange={e => setAppSettings({ ...appSettings, result_stage: e })}
                                            options={[...notificationProgramStages.map(e => ({
                                                ...e,
                                                label: e.displayName,
                                                value: e.id,
                                            }))]} />
                                    </EuiFlexItem>
                                </EuiFlexGroup>

                                <EuiFlexGroup>
                                    <EuiFlexItem>
                                        <EuiText style={{ color: '#000000', textAlign: 'left', }}>
                                            Comments
                                        </EuiText>

                                        <EuiSpacer size='s' />

                                        <Select
                                            styles={{ container: base => ({ ...base, textAlign: 'left', }) }}
                                            isSearchable
                                            value={appSettings?.result_stage_comments_data_element}
                                            onChange={e => setAppSettings({ ...appSettings, result_stage_comments_data_element: e })}
                                            options={[...currentNotificationsDataElements.map(e => ({
                                                ...e,
                                                label: e.displayName,
                                                value: e.id,
                                            }))]} />
                                    </EuiFlexItem>
                                    <EuiFlexItem>
                                        <EuiText style={{ color: '#000000', textAlign: 'left', }}>
                                            Final Reult
                                        </EuiText>

                                        <EuiSpacer size='s' />

                                        <Select
                                            styles={{ container: base => ({ ...base, textAlign: 'left', }) }}
                                            isSearchable
                                            value={appSettings?.result_stage_final_step_data_element}
                                            onChange={e => setAppSettings({ ...appSettings, result_stage_final_step_data_element: e })}
                                            options={[...currentNotificationsDataElements.map(e => ({
                                                ...e,
                                                label: e.displayName,
                                                value: e.id,
                                            }))]}
                                        />
                                    </EuiFlexItem>
                                </EuiFlexGroup>

                                <EuiSpacer size='s' />
                                <hr />
                                <EuiSpacer size='s' />
                            </EuiModalBody>

                            <EuiModalFooter style={{ backgroundColor: '#dedede' }}>
                                <EuiFlexGroup justifyContent='spaceBetween'>
                                    <EuiFlexItem grow={false}>
                                        <EuiButton size="s" fill onClick={() => saveAppConfig()}>
                                            Save Configuration
                                        </EuiButton>
                                    </EuiFlexItem>
                                </EuiFlexGroup>
                            </EuiModalFooter>
                        </EuiModal>
                    </>
                )
            }
        </>
    )
}

export default DataList

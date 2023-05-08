import { EuiFlexGroup, EuiFlexItem, EuiSpacer, EuiSwitch, EuiText } from '@elastic/eui'
import axios from 'axios'
import React, { useState, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ReferenceLine
} from 'recharts'
import { arraySorter, getWeekString, nLastWeeks, sortByKey } from '../utils/libs'
import { decryptPassword } from '../utils/libs'
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs'
import Select from 'react-select'
import MapL from './MapL'
import { data_loading_options } from './Datalist'


const GenerateDetails = ({ currentDataRow, programStartDate, programEndDate, mappings }) => {

    const [hideZeroValues, setHideZeroValues] = useState(false)
    const [periodData, setPeriodData] = useState(null)
    const [detailsResponse, setDetailsResponse] = useState([])
    // const [legacyDetailsResponse, setLegacyDetailsResponse] = useState(null)
    const [legacyData, setLegacyData] = useState([])
    const [subOUDVS, setSubOUDVS] = useState([])

    const [selectedMapping, setSelectedMapping] = useState(null)

    const loadWeeksThisYearData = async (dimension, hostname, username, rawPassword, period) => {
        try {
            const dataDXRoute = `${hostname}/api/29/analytics/dataValueSet.json?dimension=dx:${dimension}&dimension=ou:${currentDataRow?.tei?.orgUnit}&displayProperty=NAME&dimension=pe:${period}`
            const dataResponse = await axios.get(dataDXRoute, { auth: { username, password: rawPassword } })

            const dvs = []
            for (const dataValue of dataResponse.data.dataValues) {
                const s = parseInt(dataValue.period.split('W')[1])
                dvs.push({
                    ...dataValue,
                    period: s < 10 ? `${new Date().getFullYear()}W0${s}` : dataValue.period
                })
            }

            setDetailsResponse([...dvs])
        } catch (error) {
            setDetailsResponse([])
        }
    }

    const loadWeeksThisYearDataForSubOrgUnits = async (dimension, hostname, username, rawPassword, period) => {
        try {
            const suborgUnitsRoute = `${hostname}/api/29/organisationUnits.json?fields=id,name,displayName,level,parent&filter=parent.id:eq:${currentDataRow?.tei?.orgUnit}&order=displayName:ASC&paging=false`
            const subOUResponse = await axios.get(suborgUnitsRoute, { auth: { username, password: rawPassword } })

            for (const ou of subOUResponse.data.organisationUnits) {
                const dataDXRoute = `${hostname}/api/29/analytics/dataValueSet.json?dimension=dx:${dimension}&dimension=ou:${ou?.id}&displayProperty=NAME&dimension=pe:${period}`
                const dataResponse = await axios.get(dataDXRoute, { auth: { username, password: rawPassword } })

                const dvs = []
                for (const dataValue of dataResponse.data.dataValues) {
                    const s = parseInt(dataValue.period.split('W')[1])
                    dvs.push({
                        ...dataValue,
                        period: s < 10 ? `${new Date().getFullYear()}W0${s}` : dataValue.period
                    })
                }

                subOUDVS.push({
                    name: ou.displayName,
                    dataValues: arraySorter([...dvs], 'period')
                })

                setSubOUDVS([...subOUDVS])
            }
        } catch (error) {
            console.log(error)
        }
    }

    const loadLegacyData = async (dimension, hostname, username, rawPassword, period) => {
        try {
            const dataDXRoute = `${hostname}/api/29/analytics/dataValueSet.json?dimension=dx:${dimension}&dimension=ou:${currentDataRow?.tei?.orgUnit}&displayProperty=NAME&dimension=pe:${period}`
            const dataResponse = await axios.get(dataDXRoute, { auth: { username, password: rawPassword } })

            const dvs = []
            for (const dataValue of dataResponse.data.dataValues) {
                const s = parseInt(dataValue.period.split('W')[1])
                dvs.push({
                    ...dataValue,
                    period: s < 10 ? `${new Date().getFullYear()}W0${s}` : dataValue.period
                })
            }

            const sortedLegacyData = arraySorter([...dvs
                .map(dataValue => ({
                    name: dataValue.period,
                    value: parseInt(dataValue.value),
                }))], 'name')

            setLegacyData(sortedLegacyData)
        } catch (error) {
            setLegacyData(null)
        }
    }

    useEffect(() => {
        const currentMapping = mappings.find(m =>
            m?.source?.value === currentDataRow?.sourceALertDetails?.id &&
            m?.alert_or_outbreak?.value === currentDataRow?.alertGravityDetails?.id &&
            m?.target_disease?.value === currentDataRow?.diseaseTargetted?.type?.id
        )

        if (currentDataRow?.alertGravityDetails && currentDataRow?.sourceALertDetails && currentDataRow?.diseaseTargetted && currentMapping) {
            setSelectedMapping(currentMapping)
            setPeriodData(currentMapping?.data_loading_period)

            const dimension = currentMapping?.generation_metadata?.value
            const hostname = currentMapping?.hostname
            const username = currentMapping?.username
            const rawPassword = decryptPassword(currentMapping?.password)

            loadWeeksThisYearData(dimension, hostname, username, rawPassword, currentMapping?.data_loading_period?.value)
            loadLegacyData(dimension, hostname, username, rawPassword, currentMapping?.data_loading_period?.value)
            loadWeeksThisYearDataForSubOrgUnits(dimension, hostname, username, rawPassword, currentMapping?.data_loading_period?.value)
        }
    }, [])


    const handlePeriodSelection = e => {
        setPeriodData(e)

        if (currentDataRow?.alertGravityDetails && currentDataRow?.sourceALertDetails && currentDataRow?.diseaseTargetted && periodData && selectedMapping) {

            const dimension = selectedMapping?.generation_metadata?.value
            const hostname = selectedMapping?.hostname
            const username = selectedMapping?.username
            const rawPassword = decryptPassword(selectedMapping?.password)

            loadWeeksThisYearData(dimension, hostname, username, rawPassword, e?.value)
            loadLegacyData(dimension, hostname, username, rawPassword, e?.value)
            loadWeeksThisYearDataForSubOrgUnits(dimension, hostname, username, rawPassword, e?.value)
        }
    }

    if (!selectedMapping) {
        return (
            <>
                <EuiSpacer size='m' />
                <EuiSpacer size='m' />

                <EuiText textAlign='center' marginTop='10px'>
                    No Config available Yet
                </EuiText>
            </>
        )
    } else {

        return (
            <>
                <EuiSpacer size='m' />
                <EuiSpacer size='m' />
                <EuiFlexGroup>
                    <EuiFlexItem style={{ backgroundColor: '#79AAD9', color: '#FFFFFF', textAlign: 'center', padding: '10px' }}>
                        <div>
                            From {programStartDate} [<strong>{getWeekString(new Date(programStartDate))}</strong>]
                            to {programEndDate} [<strong>{getWeekString(new Date(programEndDate))}</strong>]
                        </div>
                    </EuiFlexItem>
                </EuiFlexGroup>

                <EuiSpacer size='m' />

                <EuiSpacer size='m' />

                <EuiFlexGroup justifyContent='spaceAround'>
                    <EuiFlexItem grow={false}>
                        <EuiText style={{ color: '#07C', textAlign: 'left', }}>
                            Load data for selected Period
                        </EuiText>
                        <Select
                            styles={{ container: base => ({ ...base, textAlign: 'left', }) }}
                            isSearchable
                            value={periodData}
                            onChange={e => handlePeriodSelection(e)}
                            options={[...data_loading_options]}
                        />
                    </EuiFlexItem>
                </EuiFlexGroup>

                <EuiSpacer size='m' />
                {legacyData.filter(dv => hideZeroValues ? dv.value > 0 : dv).length > 0 && (
                    <>

                        <LineChart
                            width={window.innerWidth - 500}
                            height={500}
                            data={arraySorter(legacyData, 'period').filter(dv => hideZeroValues ? dv.value > 0 : dv)}
                            margin={{
                                top: 20,
                                right: 50,
                                left: 20,
                                bottom: 5
                            }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <ReferenceLine x={getWeekString(new Date(programStartDate))} stroke="red" label="Start" />
                            <ReferenceLine x={getWeekString(new Date(programEndDate))} stroke="red" label="End" />

                            <Line type="monotone" dataKey="value" stroke="#8884d8" />
                        </LineChart>
                        <EuiSpacer size='m' />
                    </>
                )}

                <EuiSpacer size='m' />
                {
                    detailsResponse.length > 0 && (
                        <>
                            <table style={{ width: '100%', border: '1px #dedede solid', margin: '10px auto' }} cellPadding={0} cellSpacing={0}>
                                <thead>
                                    <th style={{ textAlign: 'left', fontWeight: 'bold', padding: '5px', border: '1px dotted #dedede' }}>Weeks</th>
                                    {arraySorter(detailsResponse, 'period').map(dataValue => (
                                        <th key={uuidv4()} style={{ textAlign: 'right', fontWeight: 'bold', padding: '5px', border: '1px dotted #dedede' }}>{dataValue?.period}</th>
                                    ))}
                                </thead>

                                <tbody>
                                    <tr>
                                        <td style={{ textAlign: 'left', fontWeight: 'bold', padding: '5px', border: '1px dotted #dedede' }}>Total - {currentDataRow?.exactLocation}</td>
                                        {arraySorter(detailsResponse, 'period').map(dataValue => (
                                            <th key={uuidv4()} style={{ textAlign: 'right', fontWeight: 'lighter', padding: '5px', border: '1px dotted #dedede' }}>{parseInt(dataValue?.value)}</th>
                                        ))}
                                    </tr>
                                    <tr>
                                        <td colSpan={detailsResponse.length + 1} style={{ backgroundColor: '#dedede' }}>
                                            <br />
                                        </td>
                                    </tr>

                                    {
                                        subOUDVS.length > 0 && (
                                            <>
                                                {
                                                    subOUDVS.map(ou => (
                                                        <tr key={uuidv4()} style={{ textAlign: 'left', fontWeight: 'lighter', padding: '5px', border: '1px dotted #dedede' }}>
                                                            <td style={{ padding: '5px', color: 'rgba(0,0,0,0.5)' }}>
                                                                <em>
                                                                    {ou.name}
                                                                </em>
                                                            </td>
                                                            {arraySorter(detailsResponse, 'period').map(({ period }) => (
                                                                <td key={uuidv4()} style={{ textAlign: 'right', fontWeight: 'normal', padding: '5px', border: '1px dotted #dedede', color: ou.dataValues.find(dv => dv.period === period)?.value ? '#000000' : 'rgba(0,0,0,0.5)' }}>
                                                                    {ou.dataValues.find(dv => dv.period === period)?.value || '0'}
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    ))
                                                }
                                            </>
                                        )
                                    }
                                </tbody>
                            </table>
                        </>
                    )
                }

                <EuiSpacer size='m' />
            </>
        )
    }
}

export default GenerateDetails

import React, { useEffect, useState } from 'react'
import { v1 as uuidv1 } from 'uuid'
import base64 from 'base-64'

export const VISUALIZATION_TYPE = {
    LINE: 'LINE',
    COLUMN: 'COLUMN',
    BAR: 'BAR',
    PIVOT_TABLE: 'PIVOT_TABLE',
    MAP: 'MAP'
}

const Visualization = ({ id, style, baseUrl, username, password, type }) => {

    const [favoriteData, setFavoriteData] = useState(null)
    const uuid = uuidv1()

    const loadFavorite = async (uBaseUrl, uUsername, uPassword, uType) => {
        try {
            setFavoriteData(null)
            const basePath = uBaseUrl.endsWith('/') ? uBaseUrl.slice(0, uBaseUrl.length - 1) : uBaseUrl

            let route = `${basePath}/api/visualizations/${id}.json?fields=access,aggregationType,axes,colSubTotals,colTotals,colorSet,columns[dimension,filter,legendSet[id,name,displayName,displayShortName],items[dimensionItem~rename(id),name,displayName,displayShortName,dimensionItemType]],completedOnly,created,cumulative,cumulativeValues,description,digitGroupSeparator,displayDensity,displayDescription,displayName,displayShortName,favorite,favorites,filters[dimension,filter,legendSet[id,name,displayName,displayShortName],items[dimensionItem~rename(id),name,displayName,displayShortName,dimensionItemType]],fontSize,fontStyle,hideEmptyColumns,hideEmptyRowItems,hideEmptyRows,hideSubtitle,hideTitle,href,id,interpretations[id,created],lastUpdated,lastUpdatedBy,legend,legendDisplayStrategy,legendDisplayStyle,legendSet[id,name,displayName,displayShortName],measureCriteria,name,noSpaceBetweenColumns,numberType,outlierAnalysis,parentGraphMap,percentStackedValues,publicAccess,regression,regressionType,reportingParams,rowSubTotals,rowTotals,rows[dimension,filter,legendSet[id,name,displayName,displayShortName],items[dimensionItem~rename(id),name,displayName,displayShortName,dimensionItemType]],series,shortName,showData,showDimensionLabels,showHierarchy,skipRounding,sortOrder,subscribed,subscribers,subtitle,timeField,title,topLimit,translations,type,user[name,displayName,displayShortName,userCredentials[username]],userAccesses,userGroupAccesses,yearlySeries,!attributeDimensions,!attributeValues,!category,!categoryDimensions,!categoryOptionGroupSetDimensions,!code,!columnDimensions,!dataDimensionItems,!dataElementDimensions,!dataElementGroupSetDimensions,!externalAccess,!filterDimensions,!itemOrganisationUnitGroups,!organisationUnitGroupSetDimensions,!organisationUnitLevels,!organisationUnits,!periods,!programIndicatorDimensions,!relativePeriods,!rowDimensions,!userOrganisationUnit,!userOrganisationUnitChildren,!userOrganisationUnitGrandChildren`

            if (uType && uType?.trim()?.length > 0 && uType === VISUALIZATION_TYPE.MAP) {
                route = `${baseUrl}/api/maps/tbTYrWDhxwn.json`
            }

            let headersOptions = {}

            if (uUsername && uPassword && uUsername?.trim()?.length > 0 && uPassword?.trim()?.length > 0) {
                headersOptions = { 'Authorization': `Basic ${base64.encode(`${uUsername}:${uPassword}`)}` }
            }

            const request = await fetch(route, { method: 'GET', headers: headersOptions })
            const response = await request.json()

            setFavoriteData(response)

        } catch (err) {
            setFavoriteData(null)
        }
    }

    const loadVisualization = (uUsername, uPassword, uType) => {
        const chartPlugin = window.chartPlugin
        const mapPlugin = window.mapPlugin
        const reportTablePlugin = window.reportTablePlugin

        chartPlugin.url = baseUrl
        chartPlugin.loadingIndicator = true

        reportTablePlugin.url = baseUrl
        reportTablePlugin.loadingIndicator = true

        mapPlugin.url = baseUrl
        mapPlugin.loadingIndicator = true

        if (uUsername && uPassword && uUsername?.trim()?.length > 0 && uPassword?.trim()?.length > 0) {
            chartPlugin.username = uUsername
            chartPlugin.password = uPassword

            reportTablePlugin.username = uUsername
            reportTablePlugin.password = uPassword

            mapPlugin.username = uUsername
            mapPlugin.password = uPassword
        }

        let currentPlugin = chartPlugin

        if (favoriteData?.type && favoriteData.type?.trim()?.length > 0 && uType && uType?.trim()?.length > 0 && uType !== VISUALIZATION_TYPE.MAP) {
            switch (favoriteData.type) {
                case VISUALIZATION_TYPE.PIVOT_TABLE:
                    currentPlugin = reportTablePlugin
                    break

                default:
                    currentPlugin = chartPlugin
                    break
            }
        }

        if (uType === VISUALIZATION_TYPE.MAP) {
            currentPlugin = mapPlugin
        }

        let payload = {
            ...favoriteData,
            id: null,
            el: uuid
        }

        if (uType === VISUALIZATION_TYPE.MAP) {
            payload = {
                el: uuid,
                id
            }
        }

        currentPlugin.load(payload)
    }

    useEffect(() => {
        id && baseUrl && loadFavorite(baseUrl, username, password, type)
    }, [id])

    useEffect(() => {
        baseUrl && favoriteData && uuid && loadVisualization(username, password, type)
    }, [favoriteData, uuid, type])

    return <div id={uuid} className={VISUALIZATION_TYPE.MAP === type ? 'map' : ''} style={{ width: '100%', minHeight: '400px', ...style }} />
}

export default Visualization
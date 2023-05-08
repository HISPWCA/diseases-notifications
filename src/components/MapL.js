import maplibregl, { Map } from 'maplibre-gl'
import React, { useEffect } from 'react'

const MapL = ({ mapData }) => {
  const initMap = () => {
    const map = new Map({
      // zoom: 3,
      zoom: 5,
      // center: [0, 0],
      container: 'map',
      style: `https://api.maptiler.com/maps/streets/style.json?key=${process.env.REACT_APP_MAP_KEY}`
    })

    map.on('load', () => {
      map.addControl(
        new maplibregl.GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true
          },
          trackUserLocation: true
        })
      )
      map.addControl(new maplibregl.NavigationControl())

      const firstCoordinates = mapData?.data?.features[0]?.geometry?.coordinates
      map.jumpTo({ center: firstCoordinates || [0, 0] })
      map.setZoom(firstCoordinates ? 7 : 2)

      map.addSource('earthquakes', {
        type: 'geojson',
        data: mapData.data,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50
      })

      map.setRenderWorldCopies(true)

      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'earthquakes',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step',
            ['get', 'point_count'],
            '#51bbd6',
            // '#d65151',
            100,
            '#f1f075',
            750,
            '#f28cb1'
          ],
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            20,
            100,
            30,
            750,
            40
          ]
        }
      })

      map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'earthquakes',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 12
        }
      })

      map.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'earthquakes',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': '#11b4da',
          'circle-radius': 4,
          'circle-stroke-width': 1,
          'circle-stroke-color': '#fff'
        }
      })

      // inspect a cluster on click
      map.on('click', 'clusters', e => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: ['clusters']
        })

        const clusterId = features[0].properties.cluster_id;
        map.getSource('earthquakes').getClusterExpansionZoom(
          clusterId,
          (err, zoom) => {
            if (err) return

            map.easeTo({
              center: features[0].geometry.coordinates,
              zoom,
            })
          }
        )
      })

      map.on('click', 'unclustered-point', e => {
        const coordinates = e.features[0].geometry.coordinates.slice()

        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
          coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360
        }

        new maplibregl.Popup()
          .setLngLat(coordinates)
          .setHTML(
            `
            <div style="font-weight: bold; font-size: 14px; color: #007915">
              Alert Details:
            </div>

            <!-- <br /><hr /><br> -->
            <div style="margin-top:20px">Alert Type: <strong>${e.features[0]?.properties?.type}</strong></div>
            <div>Alert Source: <strong>${e.features[0]?.properties?.source}</strong></div>
            <div>Period: <strong>${e.features[0]?.properties?.period}</strong></div>
            <div>Step: <strong>${e.features[0]?.properties?.step}</strong></div>
            <div>Trigerred On: <strong>${e.features[0]?.properties?.triggerredOn}</strong></div>
            <div>Location: <strong>${e.features[0]?.properties?.location}</strong></div>
            <div>Location Type: <strong>${e.features[0]?.properties?.locationType}</strong></div>
            <div>Exact Location: <strong>${e.features[0]?.properties?.exactLocation}</strong></div>
            `
          ).addTo(map)
      })

      map.on('mouseenter', 'clusters', function () {
        map.getCanvas().style.cursor = 'pointer'
      })

      map.on('mouseleave', 'clusters', function () {
        map.getCanvas().style.cursor = ''
      })
    })
  }

  useEffect(() => {
    initMap()
  })

  return (
    <>
      <div id='map' style={{ maxHeight: '800px', maxWidth: window.innerWidth - 100, margin: '0px auto', marginTop: '500px' }} />
    </>
  )
}

export default MapL

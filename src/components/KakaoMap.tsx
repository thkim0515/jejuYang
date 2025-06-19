import React, { useEffect, useRef, useState } from 'react';
import { fetchLocations, Location } from '../utils/fetchLocation';
import listData from '../data/list.json';
import './KakaoMap.css';

const { travelList, cafeList } = listData;

const KakaoMap = () => {
  const [selectedCategory, setSelectedCategory] = useState<'travel' | 'cafe'>('travel');
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [isKakaoLoaded, setIsKakaoLoaded] = useState(false);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const mapRef = useRef<HTMLDivElement | null>(null);

  const loadKakaoMapScript = () => {
    return new Promise<void>((resolve) => {
      if (window.kakao && window.kakao.maps) return resolve();
      const script = document.createElement('script');
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.REACT_APP_KAKAO_JS_KEY}&autoload=false&libraries=services`;
      script.async = true;
      script.onload = () => {
        setIsKakaoLoaded(true);
        resolve();
      };
      document.head.appendChild(script);
    });
  };
  
  useEffect(() => {
    console.log("✅ KAKAO JS KEY:", process.env.REACT_APP_KAKAO_JS_KEY);
    console.log("✅ KAKAO REST KEY:", process.env.REACT_APP_KAKAO_REST_KEY);
  }, []);

  
  useEffect(() => {
    loadKakaoMapScript().then(() => {
      window.kakao.maps.load(() => {
        const list = selectedCategory === 'travel' ? travelList : cafeList;
        fetchLocations(list).then(setLocations);
      });
    });
  }, [selectedCategory]);

  useEffect(() => {
    if (!isKakaoLoaded || !mapRef.current || locations.length === 0) return;

    window.kakao.maps.load(() => {
      const map = new window.kakao.maps.Map(mapRef.current, {
        center: new window.kakao.maps.LatLng(33.3617, 126.5292),
        level: 10,
      });

      setMapInstance(map);

      locations.forEach((loc) => {
        const markerPosition = new window.kakao.maps.LatLng(loc.lat, loc.lng);
        const marker = new window.kakao.maps.Marker({ map, position: markerPosition });

        const infoWindow = new window.kakao.maps.InfoWindow({
          content: `<div style="padding:6px 12px;font-size:13px;">${loc.title}</div>`,
        });

        window.kakao.maps.event.addListener(marker, 'mouseover', () => infoWindow.open(map, marker));
        window.kakao.maps.event.addListener(marker, 'mouseout', () => infoWindow.close());

        window.kakao.maps.event.addListener(marker, 'click', () => {
          setSelectedLocation(loc);
          const projection = map.getProjection();
          const point = projection.containerPointFromCoords(markerPosition);
          const sidebarWidth = 400;
          point.x += sidebarWidth / 2;
          const newCenter = projection.coordsFromContainerPoint(point);
          map.setCenter(newCenter);
        });
      });
    });
  }, [isKakaoLoaded, locations]);

  const handleClose = () => {
    setSelectedLocation(null);
    if (mapInstance) {
      mapInstance.setCenter(new window.kakao.maps.LatLng(33.3617, 126.5292));
    }
  };

  return (
    <div style={{ width: '100%', minHeight: '100vh', background: '#f6f7fb', overflowX: 'hidden' }}>
      <div style={{
        display: 'flex',
        gap: '18px',
        padding: '18px 0 18px 32px',
        background: 'linear-gradient(90deg, #D0EFFF 0%, #F0F4FF 100%)',
        borderBottom: '2px solid #dae3ed',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        boxShadow: '0 2px 12px rgba(208,239,255,0.12)'
      }}>
        <button
          onClick={() => setSelectedCategory('travel')}
          style={{
            background: selectedCategory === 'travel'
              ? 'linear-gradient(90deg, #61dafb 10%, #5eead4 90%)'
              : 'white',
            color: selectedCategory === 'travel' ? '#222' : '#6d7a90',
            fontWeight: 700,
            border: 'none',
            outline: 'none',
            borderRadius: '40px',
            padding: '10px 34px',
            fontSize: '18px',
            boxShadow: selectedCategory === 'travel'
              ? '0 4px 16px 0 rgba(97,218,251,0.08)'
              : 'none',
            transition: 'all 0.2s',
            cursor: 'pointer',
          }}
        >
          여행지 보기
        </button>
        <button
          onClick={() => setSelectedCategory('cafe')}
          style={{
            background: selectedCategory === 'cafe'
              ? 'linear-gradient(90deg, #a5b4fc 10%, #c9eeff 90%)'
              : 'white',
            color: selectedCategory === 'cafe' ? '#222' : '#6d7a90',
            fontWeight: 700,
            border: 'none',
            outline: 'none',
            borderRadius: '40px',
            padding: '10px 34px',
            fontSize: '18px',
            boxShadow: selectedCategory === 'cafe'
              ? '0 4px 16px 0 rgba(165,180,252,0.08)'
              : 'none',
            transition: 'all 0.2s',
            cursor: 'pointer',
          }}
        >
          카페 보기
        </button>
      </div>

      <div style={{
        display: 'flex',
        height: 'calc(100vh - 66px)',
        // marginTop: '66px',
        background: '#f6f7fb'
      }}>
        {selectedLocation && (
          <div className="side-area" style={{
            background: 'linear-gradient(120deg, #fff, #eaf7ff 85%)',
            padding: '30px 24px 24px 24px',
            borderRight: '2px solid #e1eaf5',
            boxShadow: '6px 0 28px 0 rgba(140,200,240,0.10)',
            overflowY: 'auto',
            overflowX: 'hidden',
            borderRadius: '0 18px 18px 0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
            gap: '20px',
            marginBottom: '22px',
            boxSizing: 'border-box',
            position: 'relative',
          }}>
            <button
              className="sideAreaCloseButton"
              onClick={handleClose}
              style={{
                position: 'absolute',
                top: '18px',
                right: '18px',
                border: 'none',
                background: 'rgba(210, 210, 210, 0.12)',
                fontSize: '21px',
                borderRadius: '50%',
                width: '38px',
                height: '38px',
                cursor: 'pointer',
                color: '#aaa',
                transition: 'background 0.2s'
              }}
              aria-label="닫기"
            >
              ×
            </button>

            <h3 style={{
              margin: '0 0 10px 0',
              color: '#2a3c60',
              fontWeight: 800,
              fontSize: '1.36rem',
              letterSpacing: '0.01em',
              textAlign: 'left',
              width: '100%',
            }}>{selectedLocation.title}</h3>

            {selectedLocation.thumbnail && (
              <img
                src={selectedLocation.thumbnail}
                alt={selectedLocation.title}
                style={{
                  width: '100%',
                  height: '180px',
                  objectFit: 'cover',
                  borderRadius: '12px',
                  boxShadow: '0 4px 24px rgba(41,122,255,0.11)',
                }}
              />
            )}

            <p style={{ margin: 0, color: '#577087', fontSize: '1.07rem', textAlign: 'left', width: '100%' }}>
              <strong>카테고리:</strong> {selectedLocation.description}
            </p>
            <p style={{ margin: 0, color: '#577087', fontSize: '1.07rem', textAlign: 'left', width: '100%' }}>
              <strong>주소:</strong> {selectedLocation.roadAddress || selectedLocation.address}
            </p>
            {selectedLocation.phone && (
              <p style={{ margin: 0, color: '#577087', fontSize: '1.07rem', textAlign: 'left', width: '100%' }}>
                <strong>전화:</strong> {selectedLocation.phone}
              </p>
            )}

            <a
              href={selectedLocation.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#3670f7',
                textDecoration: 'none',
                padding: '10px 22px',
                borderRadius: '32px',
                background: 'linear-gradient(90deg, #f7fafe, #e0f0ff 80%)',
                fontWeight: 700,
                fontSize: '1.06rem',
                boxShadow: '0 2px 10px rgba(108,149,255,0.05)',
                marginTop: '8px',
                transition: 'background 0.2s',
                textAlign: 'center',
              }}
            >
              카카오 장소보기
            </a>

            <button
              className="sideAreaFooterClose"
              onClick={handleClose}
            >
              닫기
            </button>
          </div>
        )}

        <div ref={mapRef} style={{
          flex: 1,
          border: 'none',
          marginLeft: selectedLocation ? '0' : '0',
          borderRadius: selectedLocation ? '0 0 0 18px' : '0',
          boxShadow: selectedLocation ? 'none' : '0 0 28px rgba(0,0,0,0.08)'
        }} />
      </div>
    </div>
  );
};

export default KakaoMap;

import { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import * as turf from '@turf/turf';

// BBT HQ Coordinates - Quadrado em frente ao SESC Faiçalville, Jardim Planalto, Goiânia
// Coordenadas ajustadas para a localização exata na Av. Ipanema próximo à Praça do SESC
const BBT_HQ: [number, number] = [-49.3545, -16.7385];

// Destinations with route waypoints for realistic paths
const ROUTES_CONFIG = [
    {
        name: 'São Paulo',
        destination: [-46.6333, -23.5505] as [number, number],
        color: '#10b981',
        waypoints: [
            [-49.3545, -16.7385],
            [-49.0, -17.5],
            [-48.2766, -18.9186],
            [-47.8, -21.2],
            [-47.06, -22.9],
            [-46.6333, -23.5505],
        ] as [number, number][],
    },
    {
        name: 'Brasília',
        destination: [-47.8825, -15.7942] as [number, number],
        color: '#3b82f6',
        waypoints: [
            [-49.3545, -16.7385],
            [-49.2, -16.3],
            [-48.9, -16.0],
            [-48.5, -15.9],
            [-47.8825, -15.7942],
        ] as [number, number][],
    },
    {
        name: 'Belo Horizonte',
        destination: [-43.9378, -19.9167] as [number, number],
        color: '#8b5cf6',
        waypoints: [
            [-49.3545, -16.7385],
            [-48.9, -17.2],
            [-47.5, -18.0],
            [-46.0, -18.5],
            [-44.5, -19.3],
            [-43.9378, -19.9167],
        ] as [number, number][],
    },
    {
        name: 'Cuiabá',
        destination: [-56.0979, -15.5989] as [number, number],
        color: '#f59e0b',
        waypoints: [
            [-49.3545, -16.7385],
            [-50.0, -16.5],
            [-51.5, -16.2],
            [-53.0, -15.8],
            [-56.0979, -15.5989],
        ] as [number, number][],
    },
    {
        name: 'Uberlândia',
        destination: [-48.2766, -18.9186] as [number, number],
        color: '#ef4444',
        waypoints: [
            [-49.3545, -16.7385],
            [-49.1, -17.3],
            [-48.7, -18.1],
            [-48.2766, -18.9186],
        ] as [number, number][],
    },
    {
        name: 'Palmas',
        destination: [-48.3336, -10.1689] as [number, number],
        color: '#06b6d4',
        waypoints: [
            [-49.3545, -16.7385],
            [-49.4, -15.5],
            [-49.3, -13.5],
            [-48.5, -11.5],
            [-48.3336, -10.1689],
        ] as [number, number][],
    },
    {
        name: 'Campo Grande',
        destination: [-54.6295, -20.4697] as [number, number],
        color: '#ec4899',
        waypoints: [
            [-49.3545, -16.7385],
            [-50.5, -17.5],
            [-52.0, -18.5],
            [-54.6295, -20.4697],
        ] as [number, number][],
    },
    {
        name: 'Curitiba',
        destination: [-49.2733, -25.4284] as [number, number],
        color: '#14b8a6',
        waypoints: [
            [-49.3545, -16.7385],
            [-49.0, -18.0],
            [-49.2, -20.5],
            [-49.5, -23.5],
            [-49.2733, -25.4284],
        ] as [number, number][],
    },
];

interface TruckData {
    id: string;
    plate: string;
    routeIndex: number;
    progress: number;
    speed: number;
    cargo: string;
    direction: 'outbound' | 'inbound';
    driver: string;
    phone: string;
    origin: string;
    destination: string;
    cargoValue: string;
    departureTime: string;
    estimatedArrival: string;
    status: string;
}

// Create trucks with realistic trip data
const createTrucks = (): TruckData[] => {
    const trucks: TruckData[] = [];
    const cargos = ['Grãos', 'Eletrônicos', 'Medicamentos', 'Combustível', 'Máquinas', 'Alimentos', 'Químicos', 'Têxteis', 'Peças', 'Bebidas'];
    const plates = ['GOI-2B34', 'LOG-9E12', 'FRT-7F89', 'CAR-3A56', 'TRN-5F67', 'BEN-8H90', 'BBT-1234', 'VEL-5678', 'TRP-9012', 'EXP-3456'];
    const drivers = ['João Silva', 'Carlos Oliveira', 'Pedro Santos', 'André Costa', 'Lucas Ferreira', 'Marcos Souza', 'Rafael Lima', 'Bruno Alves', 'Thiago Rocha', 'Felipe Mendes'];
    const phones = ['(62) 99999-1234', '(62) 98888-5678', '(62) 97777-9012', '(62) 96666-3456', '(62) 95555-7890'];
    const statuses = ['Em Trânsito', 'Carregando', 'Descarregando', 'Parada Programada'];
    const values = ['R$ 150.000', 'R$ 280.000', 'R$ 95.000', 'R$ 420.000', 'R$ 180.000', 'R$ 75.000', 'R$ 320.000', 'R$ 210.000'];

    ROUTES_CONFIG.forEach((route, routeIdx) => {
        const numTrucks = 2;
        for (let i = 0; i < numTrucks; i++) {
            const departureHour = 6 + Math.floor(Math.random() * 12);
            const arrivalHour = departureHour + 4 + Math.floor(Math.random() * 8);

            trucks.push({
                id: `TRK-${routeIdx}-${i}`,
                plate: plates[(routeIdx * 2 + i) % plates.length],
                routeIndex: routeIdx,
                progress: Math.random() * 0.7 + 0.15,
                speed: 0.00015 + Math.random() * 0.0001, // Slower, smoother movement
                cargo: cargos[(routeIdx + i) % cargos.length],
                direction: i % 2 === 0 ? 'outbound' : 'inbound',
                driver: drivers[(routeIdx + i) % drivers.length],
                phone: phones[(routeIdx + i) % phones.length],
                origin: i % 2 === 0 ? 'BBT Matriz - Goiânia' : route.name,
                destination: i % 2 === 0 ? route.name : 'BBT Matriz - Goiânia',
                cargoValue: values[(routeIdx + i) % values.length],
                departureTime: `${departureHour.toString().padStart(2, '0')}:${(Math.floor(Math.random() * 60)).toString().padStart(2, '0')}`,
                estimatedArrival: `${arrivalHour.toString().padStart(2, '0')}:${(Math.floor(Math.random() * 60)).toString().padStart(2, '0')}`,
                status: statuses[(routeIdx + i) % statuses.length],
            });
        }
    });

    return trucks;
};

interface BBTMatrixMapProps {
    className?: string;
    onFullscreenChange?: (isFullscreen: boolean) => void;
}

export function BBTMatrixMap({ className = '', onFullscreenChange }: BBTMatrixMapProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<maplibregl.Map | null>(null);
    const routeLinesRef = useRef<Map<string, GeoJSON.Feature<GeoJSON.LineString>>>(new Map());
    const [mapLoaded, setMapLoaded] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const trucksRef = useRef<TruckData[]>(createTrucks());
    const [selectedTruck, setSelectedTruck] = useState<TruckData | null>(null);
    const truckCount = trucksRef.current.length;
    const animationRef = useRef<number>();
    const lastTimeRef = useRef<number>(0);

    // Fullscreen toggle
    const toggleFullscreen = useCallback(() => {
        if (!containerRef.current) return;

        if (!isFullscreen) {
            if (containerRef.current.requestFullscreen) {
                containerRef.current.requestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }, [isFullscreen]);

    // Listen for fullscreen changes
    useEffect(() => {
        const handleFullscreenChange = () => {
            const fullscreenElement = document.fullscreenElement;
            const newState = fullscreenElement === containerRef.current;
            setIsFullscreen(newState);
            onFullscreenChange?.(newState);

            // Resize map when fullscreen changes
            setTimeout(() => {
                mapRef.current?.resize();
            }, 100);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, [onFullscreenChange]);

    // Generate smooth route line from waypoints
    const generateRouteLine = useCallback((waypoints: [number, number][]) => {
        const line = turf.lineString(waypoints);
        const curved = turf.bezierSpline(line, { resolution: 10000, sharpness: 0.85 });
        return curved;
    }, []);

    // Calculate position along route with smooth interpolation
    const getPositionOnRoute = useCallback((route: GeoJSON.Feature<GeoJSON.LineString>, progress: number): [number, number] => {
        const length = turf.length(route, { units: 'kilometers' });
        const distance = length * Math.max(0, Math.min(1, progress));
        const point = turf.along(route, distance, { units: 'kilometers' });
        return point.geometry.coordinates as [number, number];
    }, []);

    // Calculate bearing at position
    const getBearingOnRoute = useCallback((route: GeoJSON.Feature<GeoJSON.LineString>, progress: number): number => {
        const length = turf.length(route, { units: 'kilometers' });
        const currentDist = length * progress;
        const aheadDist = Math.min(currentDist + 10, length);

        const currentPoint = turf.along(route, currentDist, { units: 'kilometers' });
        const aheadPoint = turf.along(route, aheadDist, { units: 'kilometers' });

        return turf.bearing(currentPoint, aheadPoint);
    }, []);

    // Create truck icon - Colorful flat design style
    const createTruckIcon = useCallback((map: maplibregl.Map) => {
        const size = 40;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Dark rounded background
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
        ctx.fillStyle = '#1e293b';
        ctx.fill();
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw truck (centered)
        ctx.save();
        ctx.translate(size / 2, size / 2);

        // Truck cargo body - Orange/Yellow
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.roundRect(-8, -6, 14, 10, 2);
        ctx.fill();

        // Cargo stripes
        ctx.fillStyle = '#d97706';
        ctx.fillRect(-6, -4, 2, 6);
        ctx.fillRect(-2, -4, 2, 6);
        ctx.fillRect(2, -4, 2, 6);

        // Truck cabin - Blue
        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.roundRect(-8, -12, 8, 8, 2);
        ctx.fill();

        // Window
        ctx.fillStyle = '#93c5fd';
        ctx.beginPath();
        ctx.roundRect(-6, -10, 4, 3, 1);
        ctx.fill();

        // Wheels - Dark
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(-5, 6, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(4, 6, 3, 0, Math.PI * 2);
        ctx.fill();

        // Wheel rims
        ctx.fillStyle = '#64748b';
        ctx.beginPath();
        ctx.arc(-5, 6, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(4, 6, 1.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        const imageData = ctx.getImageData(0, 0, size, size);
        map.addImage('truck-icon', imageData, { sdf: false });
    }, []);

    // Initialize map
    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return;

        const map = new maplibregl.Map({
            container: mapContainerRef.current,
            style: 'https://tiles.openfreemap.org/styles/liberty',
            center: BBT_HQ,
            zoom: 5.5,
            pitch: 30,
            bearing: 0,
        });

        map.addControl(new maplibregl.NavigationControl(), 'top-right');

        map.on('load', () => {
            createTruckIcon(map);

            // Add routes as lines
            ROUTES_CONFIG.forEach((routeConfig, idx) => {
                const routeLine = generateRouteLine(routeConfig.waypoints);
                routeLinesRef.current.set(routeConfig.name, routeLine);

                map.addSource(`route-${idx}`, {
                    type: 'geojson',
                    data: routeLine,
                });

                map.addLayer({
                    id: `route-glow-${idx}`,
                    type: 'line',
                    source: `route-${idx}`,
                    paint: {
                        'line-color': routeConfig.color,
                        'line-width': 6,
                        'line-opacity': 0.2,
                        'line-blur': 3,
                    },
                });

                map.addLayer({
                    id: `route-line-${idx}`,
                    type: 'line',
                    source: `route-${idx}`,
                    paint: {
                        'line-color': routeConfig.color,
                        'line-width': 2,
                        'line-opacity': 0.6,
                    },
                });
            });

            // Add HQ marker
            map.addSource('hq-point', {
                type: 'geojson',
                data: {
                    type: 'Feature',
                    properties: { name: 'BBT MATRIZ' },
                    geometry: { type: 'Point', coordinates: BBT_HQ },
                },
            });

            map.addLayer({
                id: 'hq-glow',
                type: 'circle',
                source: 'hq-point',
                paint: {
                    'circle-radius': 18,
                    'circle-color': '#10b981',
                    'circle-opacity': 0.3,
                    'circle-blur': 1,
                },
            });

            map.addLayer({
                id: 'hq-marker',
                type: 'circle',
                source: 'hq-point',
                paint: {
                    'circle-radius': 7,
                    'circle-color': '#10b981',
                    'circle-stroke-color': '#ffffff',
                    'circle-stroke-width': 2,
                },
            });

            // Add destination markers
            const destinationsGeoJSON = {
                type: 'FeatureCollection' as const,
                features: ROUTES_CONFIG.map((route) => ({
                    type: 'Feature' as const,
                    properties: { name: route.name, color: route.color },
                    geometry: { type: 'Point' as const, coordinates: route.destination },
                })),
            };

            map.addSource('destinations', {
                type: 'geojson',
                data: destinationsGeoJSON,
            });

            map.addLayer({
                id: 'destinations-markers',
                type: 'circle',
                source: 'destinations',
                paint: {
                    'circle-radius': 5,
                    'circle-color': ['get', 'color'],
                    'circle-stroke-color': '#ffffff',
                    'circle-stroke-width': 2,
                },
            });

            // Initialize trucks GeoJSON source
            map.addSource('trucks', {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] },
            });

            // Truck symbol layer with custom icon
            map.addLayer({
                id: 'trucks-icons',
                type: 'symbol',
                source: 'trucks',
                layout: {
                    'icon-image': 'truck-icon',
                    'icon-size': 0.7,
                    'icon-rotate': ['get', 'bearing'],
                    'icon-rotation-alignment': 'map',
                    'icon-allow-overlap': true,
                    'icon-ignore-placement': true,
                },
            });

            // Click handler for trucks
            map.on('click', 'trucks-icons', (e) => {
                if (e.features && e.features[0]) {
                    const props = e.features[0].properties;
                    const truckId = props?.id;
                    const truck = trucksRef.current.find(t => t.id === truckId);
                    if (truck) {
                        setSelectedTruck(truck);
                    }
                }
            });

            // Change cursor on hover
            map.on('mouseenter', 'trucks-icons', () => {
                map.getCanvas().style.cursor = 'pointer';
            });

            map.on('mouseleave', 'trucks-icons', () => {
                map.getCanvas().style.cursor = '';
            });

            setMapLoaded(true);
        });

        mapRef.current = map;

        return () => {
            map.remove();
            mapRef.current = null;
        };
    }, [generateRouteLine, createTruckIcon]);

    // Smooth animation loop with delta time
    useEffect(() => {
        if (!mapLoaded || !mapRef.current) return;

        const map = mapRef.current;

        const animate = (currentTime: number) => {
            const deltaTime = lastTimeRef.current ? (currentTime - lastTimeRef.current) / 1000 : 0.016;
            lastTimeRef.current = currentTime;

            const trucks = trucksRef.current;
            const features: GeoJSON.Feature<GeoJSON.Point>[] = [];

            trucks.forEach((truck) => {
                const routeConfig = ROUTES_CONFIG[truck.routeIndex];
                const routeLine = routeLinesRef.current.get(routeConfig.name);

                if (!routeLine) return;

                // Smooth speed based on delta time (slower for realism)
                const speedFactor = deltaTime * 0.3; // Smoother movement
                let newProgress = truck.direction === 'outbound'
                    ? truck.progress + (truck.speed * speedFactor * 60)
                    : truck.progress - (truck.speed * speedFactor * 60);

                // Reverse direction at endpoints with small pause effect
                if (newProgress >= 0.98) {
                    newProgress = 0.98;
                    truck.direction = 'inbound';
                } else if (newProgress <= 0.02) {
                    newProgress = 0.02;
                    truck.direction = 'outbound';
                }

                truck.progress = newProgress;

                const position = getPositionOnRoute(routeLine, newProgress);
                let bearing = getBearingOnRoute(routeLine, newProgress);

                if (truck.direction === 'inbound') {
                    bearing = (bearing + 180) % 360;
                }

                features.push({
                    type: 'Feature',
                    properties: {
                        id: truck.id,
                        plate: truck.plate,
                        cargo: truck.cargo,
                        color: routeConfig.color,
                        bearing: bearing - 90, // Adjust for truck orientation
                        driver: truck.driver,
                        phone: truck.phone,
                        origin: truck.origin,
                        destination: truck.destination,
                        cargoValue: truck.cargoValue,
                        departureTime: truck.departureTime,
                        estimatedArrival: truck.estimatedArrival,
                        status: truck.status,
                    },
                    geometry: {
                        type: 'Point',
                        coordinates: position,
                    },
                });
            });

            const source = map.getSource('trucks') as maplibregl.GeoJSONSource;
            if (source) {
                source.setData({
                    type: 'FeatureCollection',
                    features: features,
                });
            }

            animationRef.current = requestAnimationFrame(animate);
        };

        animationRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [mapLoaded, getPositionOnRoute, getBearingOnRoute]);

    // Close popup handler
    const closePopup = () => setSelectedTruck(null);

    return (
        <div
            ref={containerRef}
            className={`relative rounded-2xl overflow-hidden ${isFullscreen ? 'rounded-none' : ''} ${className}`}
            style={isFullscreen ? { width: '100vw', height: '100vh', borderRadius: 0 } : undefined}
        >
            <div ref={mapContainerRef} className="w-full h-full min-h-[400px]" />

            {/* Fullscreen Toggle Button */}
            <button
                onClick={toggleFullscreen}
                className="absolute top-4 right-4 z-20 p-3 bg-black/30 backdrop-blur-2xl rounded-xl border border-white/20 text-white hover:bg-black/50 hover:scale-110 transition-all duration-300 shadow-lg"
                title={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
            >
                {isFullscreen ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                )}
            </button>

            {/* Overlay Stats - Ultra Transparent Glassmorphism */}
            <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-3xl rounded-2xl p-5 border border-white/10 shadow-2xl">
                <h3 className="text-sm font-bold text-white/90 mb-3 flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 shadow-lg shadow-emerald-500/50"></span>
                    </span>
                    Frota em Tempo Real
                </h3>
                <div className="text-3xl font-black bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">{truckCount}</div>
                <p className="text-xs text-white/60 font-medium mt-1">veículos ativos</p>
            </div>

            {/* Routes Legend - Ultra Transparent Glassmorphism */}
            <div className="absolute top-20 right-4 bg-black/40 backdrop-blur-3xl rounded-2xl p-4 border border-white/10 shadow-2xl">
                <h3 className="text-xs font-bold text-white/80 mb-3 uppercase tracking-wider">Rotas Ativas</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    {ROUTES_CONFIG.map((route) => (
                        <div key={route.name} className="flex items-center gap-2 group">
                            <span className="w-2.5 h-2.5 rounded-full shadow-lg transition-transform group-hover:scale-125" style={{ background: route.color, boxShadow: `0 0 10px ${route.color}50` }}></span>
                            <span className="text-[11px] text-white/80 font-medium">{route.name}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Selected Truck Popup - Trip Registration Info - Enhanced Glassmorphism */}
            {selectedTruck && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-br from-slate-900/95 via-slate-950/95 to-slate-900/95 backdrop-blur-3xl rounded-3xl border border-white/20 shadow-2xl shadow-black/60 w-80 z-50 ring-1 ring-white/10 overflow-hidden">
                    {/* Glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-benfica-blue/20 via-transparent to-emerald-500/20 pointer-events-none"></div>
                    <div className="absolute -top-20 -right-20 w-40 h-40 bg-benfica-blue/30 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-emerald-500/30 rounded-full blur-3xl pointer-events-none"></div>

                    <div className="relative p-5 border-b border-white/10 bg-gradient-to-r from-white/5 to-transparent">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div
                                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-lg border border-white/20"
                                    style={{ background: `linear-gradient(135deg, ${ROUTES_CONFIG[selectedTruck.routeIndex].color}40, ${ROUTES_CONFIG[selectedTruck.routeIndex].color}20)`, boxShadow: `0 8px 32px ${ROUTES_CONFIG[selectedTruck.routeIndex].color}30` }}
                                >
                                    🚚
                                </div>
                                <div>
                                    <h3 className="font-black text-lg text-white tracking-tight">{selectedTruck.plate}</h3>
                                    <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                                        {selectedTruck.status}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={closePopup}
                                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-xl flex items-center justify-center text-slate-400 hover:text-white transition-all duration-300 hover:scale-110 border border-white/10"
                            >
                                ✕
                            </button>
                        </div>
                    </div>

                    <div className="relative p-5 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/5 backdrop-blur-xl rounded-xl p-3 border border-white/10">
                                <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">Motorista</p>
                                <p className="text-sm font-bold text-white mt-1">{selectedTruck.driver}</p>
                            </div>
                            <div className="bg-white/5 backdrop-blur-xl rounded-xl p-3 border border-white/10">
                                <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">Telefone</p>
                                <p className="text-sm font-bold text-white mt-1">{selectedTruck.phone}</p>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-4 border border-white/15 shadow-inner">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/50"></span>
                                <p className="text-xs text-emerald-400 font-semibold">Origem</p>
                            </div>
                            <p className="text-sm font-bold text-white mb-4 pl-4">{selectedTruck.origin}</p>

                            <div className="w-px h-4 bg-gradient-to-b from-emerald-500 to-red-500 ml-1"></div>

                            <div className="flex items-center gap-2 mb-2 mt-2">
                                <span className="w-2.5 h-2.5 bg-red-500 rounded-full shadow-lg shadow-red-500/50"></span>
                                <p className="text-xs text-red-400 font-semibold">Destino</p>
                            </div>
                            <p className="text-sm font-bold text-white pl-4">{selectedTruck.destination}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/5 backdrop-blur-xl rounded-xl p-3 border border-white/10">
                                <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">Carga</p>
                                <p className="text-sm font-bold text-white mt-1">{selectedTruck.cargo}</p>
                            </div>
                            <div className="bg-emerald-500/10 backdrop-blur-xl rounded-xl p-3 border border-emerald-500/20">
                                <p className="text-[10px] text-emerald-400 uppercase font-semibold tracking-wider">Valor</p>
                                <p className="text-sm font-black text-emerald-400 mt-1">{selectedTruck.cargoValue}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/5 backdrop-blur-xl rounded-xl p-3 border border-white/10">
                                <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">Saída</p>
                                <p className="text-sm font-bold text-white mt-1">{selectedTruck.departureTime}</p>
                            </div>
                            <div className="bg-white/5 backdrop-blur-xl rounded-xl p-3 border border-white/10">
                                <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">Previsão</p>
                                <p className="text-sm font-bold text-white mt-1">{selectedTruck.estimatedArrival}</p>
                            </div>
                        </div>
                    </div>

                    <div className="relative p-5 border-t border-white/10 bg-gradient-to-r from-transparent to-white/5">
                        <button className="w-full py-3 bg-gradient-to-r from-benfica-blue to-blue-600 hover:from-blue-600 hover:to-benfica-blue text-white text-sm font-black rounded-xl transition-all duration-300 shadow-lg shadow-benfica-blue/30 hover:shadow-benfica-blue/50 hover:-translate-y-0.5 border border-white/20">
                            Ver Cadastro Completo
                        </button>
                    </div>
                </div>
            )}

            {/* Active Trucks List - Ultra Transparent */}
            <div className="absolute bottom-4 left-4 right-4 bg-black/40 backdrop-blur-3xl rounded-2xl p-4 border border-white/10 shadow-2xl">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold text-white/80 uppercase tracking-wider">Veículos em Rota</h3>
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/20 px-2 py-1 rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                        {truckCount} ativos
                    </span>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    {trucksRef.current.slice(0, 8).map((truck) => {
                        const route = ROUTES_CONFIG[truck.routeIndex];
                        return (
                            <button
                                key={truck.id}
                                onClick={() => setSelectedTruck(truck)}
                                className="flex items-center gap-3 bg-white/10 hover:bg-white/20 backdrop-blur-xl px-3 py-2.5 rounded-xl border border-white/10 hover:border-white/30 flex-shrink-0 transition-all duration-300 hover:scale-105 hover:shadow-lg group"
                            >
                                <span
                                    className="w-1.5 h-8 rounded-full transition-all group-hover:w-2"
                                    style={{ background: route.color, boxShadow: `0 0 12px ${route.color}60` }}
                                ></span>
                                <div className="text-left">
                                    <p className="text-xs font-black text-white/90">{truck.plate}</p>
                                    <p className="text-[10px] text-white/60 font-medium">{truck.cargo}</p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

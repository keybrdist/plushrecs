import * as $ from '//unpkg.com/three@0.120.0/build/three.module.js'
import { OrbitControls } from '//unpkg.com/three@0.120.0/examples/jsm/controls/OrbitControls.js'

// ----
// Configuration
// ----
const W = 10, H = 10, SW = W * 20, SH = H * 20;
const IMG_URLS = [
    "image3.jpeg",
    "image2.jpeg",
];

// Audio & Track configuration
const CONFIG = {
    // Rendering configuration
    resolution: {
        width: 200,
        height: 150
    },
    // Primary audio configuration
    audioUrl: "https://cdn-prod-1.labelgrid.com/labels/plushrecs/320/ca6494fa-405b-4828-a24f-97b9b84c2200.mp3",
    trackInfo: {
        title: "IN CIRCLES",
        artist: "ISHE",
        catalog: "PLUSH121",
        year: "2025",
        artworkUrl: "../../cat/PLUSH121/PLUSH121.jpg", // Update with actual path
        purchaseUrl: "https://plush.bandcamp.com/album/in-circles-ep",
        buttonText: "GET THIS TRACK"
    },
    // Fallback audio configuration (used when primary track finishes)
    fallbackAudioUrl: "https://azura.drmnbss.org:8010/radio.mp3",
    fallbackTrackInfo: {
        title: "PLUSH RADIO",
        artist: "Playlist Rotation",
        catalog: "PLUSH247",
        year: "", // No specific year for the stream
        artworkUrl: "../starfield/images/atmospheric_dnb_sq.png",
        purchaseUrl: "https://youtube.com/dnbradio/live",
        buttonText: "LISTEN ON YOUTUBE"
    },
};

// ----
// Scene Setup
// ----
const renderer = new $.WebGLRenderer({ alpha: true });
const scene = new $.Scene();
const camera = new $.PerspectiveCamera(75, 2, .1, 100);
const controls = new OrbitControls(camera, renderer.domElement);

// Audio analysis variables
let audioContext, analyser, dataArray, bufferLength;
let audioElement, audioSource, videoElement;
let audioInitialized = false;
let lastEnergyValues = [];
let bassEnergy = 0;
let midEnergy = 0;
let highEnergy = 0;
let showingAnnotation = false;

// Default settings
let autoRotate = true;
let autoZoom = true;
let autoRotateSpeed = 0.003;
let zoomDirection = -1; // 1 for zooming in, -1 for zooming out

// Controlled zoom settings
let controlledZoomEnabled = false; // Will be set to true after audio starts
let controlledZoomMin = 50; // Minimum zoom level (zoomed out)
let controlledZoomMax = 140; // Maximum zoom level (zoomed in)
let controlledZoomDuration = 12000; // 12 seconds for full transition from max to min (or min to max)
let controlledZoomAnimationId = null; // Animation frame ID
let controlledZoomStartTime = 0; // Animation start timestamp
let controlledZoomStartValue = 0; // Starting zoom value for the animation
let controlledZoomTargetValue = 0; // Target zoom value for the animation

// Variables to track rotation and zoom state
let lastFrameTime = 0;
let rotationVelocity = autoRotateSpeed;

// Flags to track when user is manually controlling the camera or zoom
let userRotating = false; // Specifically tracks manual rotation
let manualZoomActive = false; // Tracks manual zooming

// Set a longer cooldown before auto-zoom resumes after manual control
let manualZoomCooldown = 2000; // milliseconds

// Make meshes and geometry
const g = new $.Group(); // Declare g here for global access

// Functions for UI updates
function updateZoom() {
    const zoomSlider = document.getElementById('zoomSlider');
    if (!zoomSlider) return;
    
    const zoomValue = document.getElementById('zoomValue');
    
    // Convert the value to a floating point number to handle fractional values
    const sliderValue = parseFloat(zoomSlider.value);
    
    // Enhanced zoom calculation for extended range (50-350)
    // When slider is at 50: camera is at 10 units away (minimum zoom)
    // When slider is at 150: camera is at 0 units away (original maximum zoom)
    // When slider is at 350: camera is at -20 units away (3x more zoom, inside the object)
    let zoom;
    if (sliderValue <= 150) {
        zoom = 15 - (sliderValue / 10); // Original formula for values 50-150
    } else {
        // For values 151-350, create a steeper curve to zoom in more dramatically
        const extraZoom = sliderValue - 150;
        zoom = 0 - (extraZoom / 10); // Go into negative Z values for extreme close-ups
    }
    
    // Apply the precise zoom value to the camera
    camera.position.setZ(zoom);
    
    // Update the display value with precision (if not already updated elsewhere)
    if (zoomValue && zoomValue.textContent !== sliderValue.toString()) {
        zoomValue.textContent = sliderValue.toFixed(3);
    }
}

function updateZoomSpeedDisplay() {
    const zoomSpeedSlider = document.getElementById('zoomSpeedSlider');
    if (!zoomSpeedSlider) return;
    
    const zoomSpeedValue = document.getElementById('zoomSpeedValue');
    zoomSpeedValue.textContent = zoomSpeedSlider.value;
}

// Function to start controlled smooth zoom pattern
function startControlledZoom() {
    console.log('Starting controlled smooth zoom pattern');
    
    // Get the zoom slider
    const zoomSlider = document.getElementById('zoomSlider');
    if (!zoomSlider) return;
    
    // Set to initial zoom level (max zoom in)
    zoomSlider.value = controlledZoomMax;
    updateZoom();
    
    // Set flag to enable controlled zoom
    controlledZoomEnabled = true;
    
    // Initial direction is zooming out (from max to min)
    zoomDirection = -1;
    
    // Set up initial animation values
    controlledZoomStartValue = controlledZoomMax;
    controlledZoomTargetValue = controlledZoomMin;
    controlledZoomStartTime = performance.now();
    
    // Start the smooth animation
    startSmoothZoomAnimation();
    
    // Update button text when starting
    updateZoomCycleButtonText();
}

// Function to cancel controlled zoom animation
function cancelControlledZoom() {
    if (controlledZoomEnabled) {
        console.log('Canceling controlled zoom animation');
        controlledZoomEnabled = false;
        if (controlledZoomAnimationId) {
            cancelAnimationFrame(controlledZoomAnimationId);
            controlledZoomAnimationId = null;
        }
        
        // Update button text when canceling
        updateZoomCycleButtonText();
    }
}

// Function to update the zoom cycle button text
function updateZoomCycleButtonText() {
    const button = document.getElementById('startControlledZoomBtn');
    if (button) {
        button.textContent = controlledZoomEnabled ? 'STOP ZOOM CYCLE' : 'START ZOOM CYCLE';
    }
}

// Function to animate zoom smoothly using requestAnimationFrame
function startSmoothZoomAnimation() {
    // Cancel any existing animation
    if (controlledZoomAnimationId) {
        cancelAnimationFrame(controlledZoomAnimationId);
    }
    
    // Function to perform the animation
    function animateZoom(timestamp) {
        // Get elapsed time since animation start
        const elapsed = timestamp - controlledZoomStartTime;
        
        // Calculate progress (0 to 1)
        let progress = Math.min(elapsed / controlledZoomDuration, 1);
        
        // Use easing function for smoother motion (cubic ease-in-out)
        progress = progress < 0.5 ? 4 * progress * progress * progress :
                  1 - Math.pow(-2 * progress + 2, 3) / 2;
        
        // Calculate current zoom value
        const newValue = controlledZoomStartValue + progress * (controlledZoomTargetValue - controlledZoomStartValue);
        
        // Update the zoom slider - use precise floating point values
        const zoomSlider = document.getElementById('zoomSlider');
        if (zoomSlider) {
            // Set the value with 3 decimal precision (0.001)
            zoomSlider.value = newValue.toFixed(3);
            updateZoom();
            
            // Also update the displayed value with precision
            const zoomValue = document.getElementById('zoomValue');
            if (zoomValue) {
                zoomValue.textContent = parseFloat(newValue.toFixed(3));
            }
        }
        
        // Check if animation is complete
        if (progress >= 1) {
            // Reverse the direction and set new start/target values
            if (zoomDirection === -1) {
                // We just reached min zoom, now zoom back in
                zoomDirection = 1;
                controlledZoomStartValue = controlledZoomMin;
                controlledZoomTargetValue = controlledZoomMax;
            } else {
                // We just reached max zoom, now zoom back out
                zoomDirection = -1;
                controlledZoomStartValue = controlledZoomMax;
                controlledZoomTargetValue = controlledZoomMin;
            }
            
            // Reset animation start time
            controlledZoomStartTime = performance.now();
        }
        
        // Continue animation
        controlledZoomAnimationId = requestAnimationFrame(animateZoom);
    }
    
    // Start the animation
    controlledZoomAnimationId = requestAnimationFrame(animateZoom);
}
// Function for auto-zoom handling
function handleAutoZoom() {
    // Skip if controlled zoom is enabled
    if (controlledZoomEnabled) return;
    
    // Don't auto-zoom if it's disabled or if manual zooming is active
    if (!autoZoom || manualZoomActive) return;
    
    const zoomSlider = document.getElementById('zoomSlider');
    const zoomSpeedSlider = document.getElementById('zoomSpeedSlider');
    if (!zoomSlider || !zoomSpeedSlider) return;
    
    const currentValue = parseFloat(zoomSlider.value);
    
    // Update boundaries to match the new slider range (50-350)
    if (currentValue >= 349) zoomDirection = -1; // Use 349 instead of 350 to avoid edge case
    if (currentValue <= 51) zoomDirection = 1;   // Use 51 instead of 50 to avoid edge case
    
    // Adjust zoom speed based on zoom level for smoother transitions at extreme zooms
    let zoomSpeed;
    if (currentValue <= 150) {
        zoomSpeed = (zoomSpeedSlider.value / 100) * 0.2; // Original speed for normal zoom range
    } else {
        // Increase speed for the extended zoom range to make auto-zoom more effective
        zoomSpeed = (zoomSpeedSlider.value / 100) * 0.4; 
    }
    
    // Apply the zoom change gradually
    zoomSlider.value = (currentValue + (zoomDirection * zoomSpeed)).toFixed(3);
    updateZoom();
}

function initializeUI() {
    // Add renderer to page
    document.body.prepend(renderer.domElement);
    
    // Set up the toggle button and controls panel
    const controlsToggle = document.getElementById('controlsToggle');
    const controls = document.querySelector('.controls');
    const startControlledZoomBtn = document.getElementById('startControlledZoomBtn');
    
    // Set the canvas size to match the window
    const resize = () => {
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    };
    
    // Update the canvas size when the window is resized
    window.addEventListener('resize', resize);
    resize();
    
    // Set up zoom slider event listener
    if (zoomSlider) {
        zoomSlider.addEventListener('input', updateZoom);
    }
    
    // Set up zoom speed slider event listener
    if (zoomSpeedSlider) {
        zoomSpeedSlider.addEventListener('input', updateZoomSpeedDisplay);
    }
    
    // Set up auto-rotate toggle
    if (autoRotateToggle) {
        autoRotateToggle.addEventListener('change', () => {
            autoRotate = autoRotateToggle.checked;
        });
    }
    
    // Set up auto-zoom toggle
    if (autoZoomToggle) {
        autoZoomToggle.addEventListener('change', () => {
            autoZoom = autoZoomToggle.checked;
        });
    }
    
    // Set up controlled zoom button
    if (startControlledZoomBtn) {
        // Initialize button text
        updateZoomCycleButtonText();
        
        startControlledZoomBtn.addEventListener('click', () => {
            if (controlledZoomEnabled) {
                // If zoom cycle is running, stop it
                cancelControlledZoom();
            } else {
                // If zoom cycle is not running, start it
                startControlledZoom();
            }
        });
    }
    
    // Set up controls toggle
    if (controlsToggle && controls) {
        // Initially hide controls and set button text
        controls.style.display = 'block';
        controlsToggle.textContent = '×';
        
        controlsToggle.addEventListener('click', () => {
            const isVisible = controls.style.display === 'block';
            controls.style.display = isVisible ? 'none' : 'block';
            controlsToggle.textContent = isVisible ? '+' : '×';
        });
    }
    
    // Add info about mouse control temporarily disabling auto features
    const canvasContainer = document.getElementById('canvas-container');
    if (canvasContainer) {
        canvasContainer.title = 'Mouse interaction temporarily pauses auto-zoom and rotation';
    }
}

// Create the 3D scene
function createScene() {
    // Add lights
    for (const { color, intensity, x, y, z } of [
        { color: 'white', intensity: 1, x: -W, y: 0, z: 0 },
        { color: 'white', intensity: 1, x: W, y: 0, z: 0 },
    ]) {
        const L = new $.SpotLight(color, intensity, W, Math.PI / 2, 0, 0);
        L.position.set(x, y, z);
        scene.add(L);
    }
    
    // Create vertex data
    const vs = [];
    for (let i = 0, I = SH; i < I; ++i) {
        vs[i] = [];
        const nY = i / (I - 1);
        for (let j = 0, J = SW; j < J; ++j) {
            const nX = j / (J - 1);
            vs[i][j] = {
                uv: [nX, nY],
                xyz: [(nX - 0.5) * W, (nY - 0.5) * H, (i + 1) % 2 * (j % 2) * 0.5 - 0.25]
            };
        }
    }

    // Make Geometry - 2 Sets
    const geoms = [];
    for (let k = 0; k <= 1; ++k) {
        const geom = new $.BufferGeometry();
        const N = ((SW - k) >> 1) * (SH - 1);
        const pos = new Float32Array(N * 3 * 6); // six (x,y,z)
        const uv = new Float32Array(N * 2 * 6); // six (u,v)
        let n = 0;
        for (let i = 0, I = SH - 1; i < I; ++i) {
            for (let j = k, J = SW - 1; j < J; j += 2) {
                let v = vs[i][j];
                pos.set(v.xyz, n * 3);
                uv.set(v.uv, n * 2);
                ++n;
                v = vs[i][j + 1];
                pos.set(v.xyz, n * 3);
                uv.set(v.uv, n * 2);
                ++n;
                v = vs[i + 1][j];
                pos.set(v.xyz, n * 3);
                uv.set(v.uv, n * 2);
                ++n;
                v = vs[i][j + 1];
                pos.set(v.xyz, n * 3);
                uv.set(v.uv, n * 2);
                ++n;
                v = vs[i + 1][j + 1];
                pos.set(v.xyz, n * 3);
                uv.set(v.uv, n * 2);
                ++n;
                v = vs[i + 1][j];
                pos.set(v.xyz, n * 3);
                uv.set(v.uv, n * 2);
                ++n;
            }
        }
        geom.setAttribute('position', new $.Float32BufferAttribute(pos, 3));
        geom.setAttribute('uv', new $.Float32BufferAttribute(uv, 2));
        geom.computeVertexNormals();
        geoms.push(geom);
    }

    // Make Meshes
    for (const [i, geom] of geoms.entries()) {
        const map = new $.TextureLoader().load(IMG_URLS[i]);
        const mat = new $.MeshLambertMaterial({ map, side: $.DoubleSide });
        const mesh = new $.Mesh(geoms[i], mat);
        g.add(mesh);
    }
    scene.add(g);
}

// ----
// Initialize after DOM is loaded
// ----
document.addEventListener('DOMContentLoaded', () => {
    // Set up audio button event listener with explicit user interaction handling
    const startAudioButton = document.getElementById('startAudio');
    if (startAudioButton) {
        startAudioButton.addEventListener('click', function(event) {
            console.log('Start audio button clicked - user interaction detected');
            
            // Create audio context on user gesture if it doesn't exist
            if (!audioContext) {
                try {
                    audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    console.log('AudioContext created on user gesture');
                } catch (e) {
                    console.error('Failed to create AudioContext:', e);
                }
            }
            
            // Resume AudioContext immediately on user gesture (critical for audio playback)
            if (audioContext && audioContext.state === 'suspended') {
                audioContext.resume().then(() => {
                    console.log('AudioContext resumed on user gesture');
                }).catch(err => {
                    console.error('Failed to resume AudioContext on gesture:', err);
                });
            }
            
            // Then initialize the audio
            initializeAudio();
        });
    }
    
    // Setup ID avatar for annotation toggle
    const idAvatar = document.getElementById('id-avatar');
    if (idAvatar) {
        idAvatar.addEventListener('click', toggleAnnotations);
        idAvatar.style.display = 'none'; // Hide until audio starts
    }
    
    // Initialize UI elements
    initializeUI();
    
    // Create 3D scene
    createScene();
    
    // Initialize display settings
    updateZoom();
    updateZoomSpeedDisplay();
});

// Setup event listeners for orbit controls
// Track when interaction starts - only mark as rotating if it's not a wheel event
controls.addEventListener('start', (event) => {
    userRotating = true;
    manualZoomActive = true; // Treat rotation control as manual zoom too
    
    // Cancel controlled zoom animation on manual rotation
    cancelControlledZoom();
    
    // Save the current position before user interaction
    lastFrameTime = performance.now();
});

controls.addEventListener('end', () => {
    userRotating = false;
    
    // Capture the last frame time when user releases control
    lastFrameTime = performance.now();
});

// Listen for scroll/zoom events and connect to zoom slider
renderer.domElement.addEventListener('wheel', (event) => {
    // Only mark zooming as active, but not rotation control
    manualZoomActive = true;
    
    // Cancel controlled zoom animation on manual wheel zoom
    cancelControlledZoom();
    
    // Get the current zoom slider value
    const zoomSlider = document.getElementById('zoomSlider');
    if (!zoomSlider) return;
    
    // Get the zoom speed slider to adjust sensitivity
    const zoomSpeedSlider = document.getElementById('zoomSpeedSlider');
    
    // Determine scroll direction and calculate zoom amount based on speed slider
    // Negative deltaY means scrolling up/away (zoom out)
    // Positive deltaY means scrolling down/toward (zoom in)
    let scrollAmount;
    
    if (zoomSpeedSlider) {
        // Scale the scroll amount by the zoom speed slider value
        // Min value (1) = very slow zooming, Max value (100) = fast zooming
        const speedFactor = Math.max(0.2, zoomSpeedSlider.value / 20); // Convert 1-100 to a reasonable factor (0.2-5)
        scrollAmount = event.deltaY > 0 ? -speedFactor : speedFactor;
    } else {
        // Fallback if slider isn't available
        scrollAmount = event.deltaY > 0 ? -5 : 5;
    }
    
    // Update the slider value directly
    const newValue = Math.max(50, Math.min(350, parseInt(zoomSlider.value) + scrollAmount));
    zoomSlider.value = newValue;
    
    // Apply the zoom change
    updateZoom();
    
    // Prevent the default scroll behavior
    event.preventDefault();
    
    // Clear any existing timers
    if (window.scrollResetTimer) {
        clearTimeout(window.scrollResetTimer);
    }
    
    // No need to reset userRotating since we're not setting it during wheel events
    
    // Set a longer cooldown for the manual zoom flag
    // This prevents auto-zoom from interfering right after manual zooming
    if (window.manualZoomTimer) {
        clearTimeout(window.manualZoomTimer);
    }
    
    window.manualZoomTimer = setTimeout(() => {
        manualZoomActive = false;
    }, manualZoomCooldown);
});

// Audio initialization function
function initializeAudio() {
    // Hide start button
    const startButton = document.getElementById('startAudio');
    if (startButton) {
        startButton.style.display = 'none';
    }
    
    document.querySelector('.status').textContent = 'Connecting to audio...'; 
    
    // Create the AudioContext - must be created on user gesture
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    // Resume AudioContext (important for WebAudio API)
    if (audioContext.state === 'suspended') {
        audioContext.resume().catch(err => console.error('Failed to resume AudioContext:', err));
    }
    
    // Create audio element for primary track
    if (!audioElement) {
        audioElement = new Audio();
        audioElement.crossOrigin = 'anonymous';
        audioElement.volume = 1.0;
        audioElement.controls = false; // Hide controls
        audioElement.id = 'audioElement';
        // Add to DOM for debugging and to ensure it doesn't get garbage collected
        audioElement.style.display = 'none';
        document.body.appendChild(audioElement);
    }
    
    // Create video element for compatibility with certain streaming formats
    if (!videoElement) {
        videoElement = document.createElement('video');
        videoElement.crossOrigin = 'anonymous';
        videoElement.style.display = 'none';
        videoElement.autoplay = true;
        videoElement.volume = 1.0; // Set to full volume
        videoElement.id = 'videoElement';
        document.body.appendChild(videoElement);
    }
    
    // Add visible controls for debugging if needed
    // const debugControls = document.createElement('div');
    // debugControls.innerHTML = `<button onclick="document.getElementById('audioElement').play()">Play Audio</button>`;
    // document.body.appendChild(debugControls);
    
    // Initialize audio stream with the configured URL
    initStreamAudio();
    
    console.log('Audio initialization complete. Context state:', audioContext.state);
}

// Initialize audio stream with error handling and fallbacks
function initStreamAudio() {
    try {
        // Show status message
        document.querySelector('.status').textContent = 'Connecting to audio...'; 
        
        // Resume audio context if it's suspended (common with autoplay policies)
        if (audioContext.state === 'suspended') {
            audioContext.resume().then(() => {
                console.log('AudioContext resumed successfully');
            }).catch(err => {
                console.error('Failed to resume AudioContext:', err);
            });
        }
        
        // Set source to configured audio URL
        audioElement.src = CONFIG.audioUrl;
        
        // Try to play directly with the audio element first (simpler approach)
        console.log('Starting audio playback...');
        audioElement.play()
            .then(() => {
                console.log('Audio playback started successfully!');
                setupAudioAnalyzer(audioElement);
                
                // Show the ID avatar once audio is playing
                const idAvatar = document.getElementById('id-avatar');
                if (idAvatar) {
                    idAvatar.style.display = 'flex';
                }
                
                // Display the current track info
                document.querySelector('.status').textContent = 'Playing: ' + CONFIG.trackInfo.artist + ' - ' + CONFIG.trackInfo.title;
                

                // Initialize and update annotations
                initializeAnnotation();
                updateAnnotationContent(CONFIG.trackInfo);
                
                // Update credits display
                updateCredits(CONFIG.trackInfo.artist);
                
                // Mark audio as initialized
                audioInitialized = true;
                
                // Start the controlled zoom pattern
                startControlledZoom();
            })
            .catch(error => {
                console.error('Audio element playback failed, trying video element fallback:', error);
                
                // Fall back to using the video element if audio element fails
                videoElement.src = CONFIG.audioUrl;
                
                const attemptVideoPlay = () => {
                    videoElement.play()
                        .then(() => {
                            console.log('Audio playback started with video element');
                            // Create audio analyzer and connect to source
                            setupAudioAnalyzer(videoElement);
                            
                            // Show the ID avatar once audio is playing
                            const idAvatar = document.getElementById('id-avatar');
                            if (idAvatar) {
                                idAvatar.style.display = 'flex';
                            }
                            
                            // Display the current track info
                            document.querySelector('.status').textContent = 'Playing: ' + CONFIG.trackInfo.artist + ' - ' + CONFIG.trackInfo.title;
                            
                            // Initialize and update annotations
                            initializeAnnotation();
                            updateAnnotationContent(CONFIG.trackInfo);
                            
                            // Update credits display
                            updateCredits(CONFIG.trackInfo.artist);
                            
                            // Mark audio as initialized
                            audioInitialized = true;
                            
                            // Start the controlled zoom pattern
                            startControlledZoom();
                        })
                        .catch(videoError => {
                            console.error('Both audio and video playback failed:', videoError);
                            // Try fallback audio
                            switchToFallbackAudio();
                        });
                };
                
                // Wait for loadedmetadata event before attempting to play video element
                videoElement.addEventListener('loadedmetadata', attemptVideoPlay);
            });
        
        // Handle when playback stops
        audioElement.addEventListener('ended', () => {
            console.log('Main audio track ended, switching to fallback stream');
            switchToFallbackAudio();
        });
        
        // Handle errors
        audioElement.addEventListener('error', (e) => {
            console.error('Audio element error:', e);
            switchToFallbackAudio();
        });
        
        // Try fallback if loading takes too long (5 seconds timeout)
        setTimeout(() => {
            if (!audioInitialized) {
                console.warn('Audio loading timeout, trying fallback');
                switchToFallbackAudio();
            }
        }, 5000);
        
    } catch (error) {
        console.error('Audio initialization error:', error);
        switchToFallbackAudio();
    }
}

// Track which elements have already been connected to avoid duplicate connections
let connectedElements = new WeakMap();

// Set up audio analyzer for frequency data
function setupAudioAnalyzer(sourceElement) {
    try {
        console.log('Setting up audio analyzer for', sourceElement.id || 'unnamed element');
        
        // Check if this element is already connected to avoid the InvalidStateError
        if (connectedElements.has(sourceElement)) {
            console.log('Element already connected, reusing existing setup');
            return;
        }
        
        // If we already have an audioSource, disconnect it first to avoid issues
        if (audioSource) {
            try {
                audioSource.disconnect();
                console.log('Disconnected previous audio source');
            } catch (e) {
                console.warn('Could not disconnect previous source:', e);
            }
        }
        
        // Create audio source from element
        try {
            audioSource = audioContext.createMediaElementSource(sourceElement);
            console.log('Created new media element source successfully');
        } catch (sourceError) {
            console.error('Failed to create media element source:', sourceError);
            // Try reconnecting existing source to destination directly as fallback
            if (audioSource) {
                try {
                    audioSource.connect(audioContext.destination);
                    console.log('Reconnected existing source to destination');
                    return;
                } catch (reconnectError) {
                    console.error('Reconnect failed:', reconnectError);
                }
            }
            return; // Cannot proceed without audio source
        }
        
        // Create analyzer if it doesn't exist
        if (!analyser) {
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 1024;
            bufferLength = analyser.frequencyBinCount;
            dataArray = new Uint8Array(bufferLength);
            console.log('Created new analyzer node');
        }
        
        // Connect source to analyzer and then to destination
        try {
            audioSource.connect(analyser);
            analyser.connect(audioContext.destination);
            console.log('Connected audio source to analyzer and destination');
            
            // Mark this element as connected
            connectedElements.set(sourceElement, true);
            
            // Get initial data
            analyser.getByteFrequencyData(dataArray);
            console.log('Audio analyzer setup complete');
        } catch (connectionError) {
            console.error('Failed to connect nodes:', connectionError);
            
            // Last resort: try to connect source directly to destination
            try {
                audioSource.connect(audioContext.destination);
                console.log('Connected source directly to destination as fallback');
            } catch (directError) {
                console.error('Direct connection failed:', directError);
            }
        }
    } catch (error) {
        console.error('Audio analyzer setup error:', error);
        
        // Try to at least get audio playing by connecting directly
        try {
            sourceElement.play().catch(e => console.error('Play failed in error recovery:', e));
        } catch (e) {
            console.error('Final audio playback attempt failed:', e);
        }
    }
}

// Switch to fallback audio stream
function switchToFallbackAudio() {
    try {
        // Update UI with fallback info
        updateAnnotationContent(CONFIG.fallbackTrackInfo);
        
        // Update status
        document.querySelector('.status').textContent = 'Connecting to stream: ' + CONFIG.fallbackTrackInfo.artist + ' - ' + CONFIG.fallbackTrackInfo.title;
        
        // First try with audio element (preferred)
        audioElement.src = CONFIG.fallbackAudioUrl;
        
        // Ensure the context is resumed
        if (audioContext.state === 'suspended') {
            audioContext.resume().catch(err => console.error('Failed to resume context:', err));
        }
        
        // Try to play with audio element
        audioElement.play()
            .then(() => {
                console.log('Fallback audio started with audio element');
                // Make sure we have an analyzer setup
                if (!analyser || !audioSource) {
                    setupAudioAnalyzer(audioElement);
                }
                
                document.querySelector('.status').textContent = 'Streaming: ' + CONFIG.fallbackTrackInfo.artist + ' - ' + CONFIG.fallbackTrackInfo.title;
                audioInitialized = true;
            })
            .catch(error => {
                console.error('Fallback audio failed with audio element:', error);
                
                // Try with video element as backup
                if (videoElement) {
                    videoElement.src = CONFIG.fallbackAudioUrl;
                    videoElement.play()
                        .then(() => {
                            console.log('Fallback audio started with video element');
                            // Setup analyzer if needed
                            if (!analyser) {
                                setupAudioAnalyzer(videoElement);
                            }
                            
                            document.querySelector('.status').textContent = 'Streaming: ' + CONFIG.fallbackTrackInfo.artist + ' - ' + CONFIG.fallbackTrackInfo.title;
                            audioInitialized = true;
                        })
                        .catch(videoError => {
                            console.error('Fallback audio failed completely:', videoError);
                            document.querySelector('.status').textContent = 'Audio unavailable';
                        });
                }
            });
    } catch (error) {
        console.error('Error switching to fallback:', error);
        document.querySelector('.status').textContent = 'Audio unavailable';
    }
}

// Initialize annotation display
function initializeAnnotation() {
    const annotation = document.getElementById('annotation');
    if (annotation) {
        // Initially hide annotation
        annotation.style.opacity = '0';
        annotation.style.visibility = 'hidden';
    }
}

// Update annotation content with track info
function updateAnnotationContent(trackInfo) {
    // Get elements
    const artworkImg = document.getElementById('annotationArtwork');
    const purchaseLink = document.getElementById('purchaseLink');
    
    // Update content
    if (artworkImg) {
        artworkImg.src = trackInfo.artworkUrl;
        artworkImg.alt = trackInfo.catalog + ' Artwork';
    }
    
    // Update text elements
    document.getElementById('annotationTitle').textContent = trackInfo.title;
    document.getElementById('annotationArtist').textContent = trackInfo.artist;
    document.getElementById('annotationDetails').textContent = trackInfo.catalog + (trackInfo.year ? ' • ' + trackInfo.year : '');
    
    // Update purchase link
    if (purchaseLink) {
        purchaseLink.href = trackInfo.purchaseUrl;
        purchaseLink.textContent = trackInfo.buttonText || "GET THIS TRACK";
    }
    
    // Update credits display
    updateCredits(trackInfo.artist);
}

// Toggle annotations visibility
function toggleAnnotations() {
    const annotation = document.getElementById('annotation');
    
    if (annotation) {
        // Check current state to toggle
        if (annotation.style.opacity === '1') {
            // Hide annotations if visible
            showingAnnotation = false;
            annotation.style.opacity = '0';
            annotation.style.visibility = 'hidden';
            annotation.style.pointerEvents = 'none';
        } else {
            // Show annotations if hidden
            showingAnnotation = true;
            annotation.style.opacity = '1';
            annotation.style.visibility = 'visible';
            annotation.style.pointerEvents = 'auto';
        }
    }
}

// Update the credits display
function updateCredits(artist) {
    const creditsElement = document.getElementById('credits');
    if (creditsElement) {
        creditsElement.textContent = `music ${artist} • gfx ycwhk x SHOEBOX`;
    }
}

// Try fallback audio with appropriate loading/error handling
function tryFallbackAudio(useFallback = false) {
    try {
        // Determine which audio source to use
        const audioUrl = useFallback ? CONFIG.fallbackAudioUrl : CONFIG.audioUrl;
        const trackInfo = useFallback ? CONFIG.fallbackTrackInfo : CONFIG.trackInfo;
        
        // Update status
        document.querySelector('.status').textContent = 'Connecting to audio...';
        
        // Set audio source
        audioElement.src = audioUrl;
        
        // Attempt to play the audio
        audioElement.play()
            .then(() => {
                if (!audioSource) {
                    setupAudioAnalyzer(audioElement);
                }
                
                // Update UI
                document.querySelector('.status').textContent = useFallback ?
                    'Streaming: ' + trackInfo.artist + ' - ' + trackInfo.title : 
                    'Playing: ' + trackInfo.artist + ' - ' + trackInfo.title;
                
                // Show info button
                const idAvatar = document.getElementById('id-avatar');
                if (idAvatar) idAvatar.style.display = 'flex';
                
                // Update track info display
                updateAnnotationContent(trackInfo);
                
                // Mark as initialized
                audioInitialized = true;
            })
            .catch(error => {
                console.error('Audio playback error:', error);
                
                // If main track fails, try fallback
                if (!useFallback) {
                    tryFallbackAudio(true);
                } else {
                    // Both sources failed
                    document.querySelector('.status').textContent = 'Audio unavailable';
                }
            });
            
        // Try network check for streaming audio
        fetch(audioUrl, {
            method: 'HEAD',
            mode: 'no-cors' // This allows checking if resource exists without CORS issues
        })
            .then(() => {
                // Resource exists and is accessible
                console.log('Audio URL is accessible');
            })
            .catch(error => {
                console.error('Fetch failed:', error);
                document.querySelector('.status').textContent = 'Audio connection failed';
            });
    } catch (error) {
        console.error('Fallback audio error:', error);
        document.querySelector('.status').textContent = 'Audio unavailable';
    }
}

// Track camera changes during controls update
controls.addEventListener('change', () => {
    if (userRotating || manualZoomActive) {
        // Reset the frame time to ensure smooth transition
        lastFrameTime = performance.now();
        
        // Update the zoom slider to match camera position when using OrbitControls zoom
        // This keeps the slider in sync with the camera
        const zoomSlider = document.getElementById('zoomSlider');
        if (zoomSlider) {
            const cameraZPos = camera.position.z;
            let sliderValue;
            
            // Convert camera Z position back to slider value using the inverse of our zoom formula
            if (cameraZPos >= 0) {
                sliderValue = (15 - cameraZPos) * 10; // For camera pos 0-10
            } else {
                sliderValue = 150 + Math.abs(cameraZPos) * 10; // For camera pos < 0
            }
            
            // Make sure it's within bounds
            sliderValue = Math.max(50, Math.min(350, sliderValue));
            zoomSlider.value = sliderValue;
            
            // Update the displayed value
            const zoomValue = document.getElementById('zoomValue');
            if (zoomValue) {
                zoomValue.textContent = Math.round(sliderValue);
            }
        }
    }
});

// Setup animation loop with time-based rotation
renderer.setAnimationLoop(t => {
    const currentTime = performance.now();
    const deltaTime = (currentTime - lastFrameTime) / 1000; // Convert to seconds
    lastFrameTime = currentTime;
    
    // Update audio analysis if audio is initialized - for track info only, no visualization effect
    if (audioInitialized && analyser) {
        // Still get frequency data to keep the analyzer working
        analyser.getByteFrequencyData(dataArray);
    }
    
    // Apply rotation with time-based increment to ensure smooth motion
    // Only pause rotation if user is manually rotating (not when zooming)
    if (autoRotate && !userRotating) {
        // Apply rotation smoothly based on elapsed time (no audio reactivity)
        g.rotation.y += autoRotateSpeed * deltaTime * 60; // Normalize to ~60fps
    }
    
    // Only apply auto-zoom when manual zoom is not active
    if (autoZoom && !manualZoomActive) {
        handleAutoZoom();
    }
    
    renderer.render(scene, camera);
    controls.update();
});

import React, { useState, useRef, useEffect } from 'react';
import { Download, Upload, Type, Sliders, FileType, FileText } from 'lucide-react';
// No need to import the image file directly as it's in the public folder

// Define styles object to replace Tailwind classes
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: '#111',
    color: 'white',
  },
  header: {
    backgroundColor: '#000',
    padding: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#2563eb',
    padding: '8px 16px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
  },
  buttonHover: {
    backgroundColor: '#1d4ed8',
  },
  contentContainer: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },
  toolsPanel: {
    width: '256px',
    backgroundColor: '#1f2937',
    padding: '16px',
    overflowY: 'auto',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  sectionContainer: {
    marginBottom: '24px',
  },
  uploadButton: {
    width: '100%',
    backgroundColor: '#374151',
    padding: '8px 16px',
    borderRadius: '4px',
    marginBottom: '8px',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
  },
  uploadButtonHover: {
    backgroundColor: '#4B5563',
  },
  smallText: {
    fontSize: '12px',
    color: '#9CA3AF',
    marginTop: '4px',
  },
  notificationSuccess: {
    marginTop: '8px',
    padding: '8px',
    backgroundColor: 'rgba(6, 78, 59, 0.5)',
    borderRadius: '4px',
  },
  notificationPending: {
    marginTop: '8px',
    padding: '8px',
    backgroundColor: 'rgba(146, 64, 14, 0.5)',
    borderRadius: '4px',
  },
  labelText: {
    display: 'block',
    fontSize: '14px',
    marginBottom: '4px',
  },
  input: {
    width: '100%',
    backgroundColor: '#374151',
    border: '1px solid #4B5563',
    borderRadius: '4px',
    padding: '4px 8px',
    color: 'white',
    marginBottom: '12px',
  },
  select: {
    width: '100%',
    backgroundColor: '#374151',
    border: '1px solid #4B5563',
    borderRadius: '4px',
    padding: '4px 8px',
    color: 'white',
    marginBottom: '12px',
  },
  colorInput: {
    width: '100%',
    height: '32px',
    backgroundColor: '#374151',
    border: '1px solid #4B5563',
    borderRadius: '4px',
    marginBottom: '12px',
  },
  canvasContainer: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
    backgroundColor: '#111',
    overflow: 'auto',
  },
  canvasWrapper: {
    position: 'relative',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  },
  canvas: {
    border: '1px solid #374151',
  },
  hidden: {
    display: 'none',
  },
};

// Main app component
const AlbumCoverCreator = () => {
  // State for the uploaded image
  const [backgroundImage, setBackgroundImage] = useState(null);
  // State to track if default background is being loaded
  const [isLoadingDefaultBackground, setIsLoadingDefaultBackground] = useState(true);
  // State to track if using default background
  const [isUsingDefaultBackground, setIsUsingDefaultBackground] = useState(false);
  // State for reset button hover
  const [resetBtnHover, setResetBtnHover] = useState(false);

  // State for text content
  const [textContent, setTextContent] = useState({
    title: 'WITCHY & WOBBLE',
    artist: 'DJ AIRWALK',
    catalogNumber: 'PLUSH120'
  });

  // State for text styles
  const [textStyles, setTextStyles] = useState({
    titleSize: '28px',
    artistSize: '20px',
    catalogNumberSize: '20px',
    fontFamily: 'monospace',
    color: '#000000'
  });

  // State for custom font
  const [customFont, setCustomFont] = useState({
    loaded: false,
    name: '',
    url: null
  });
  
  // State to track default font loading
  const [isLoadingDefaultFont, setIsLoadingDefaultFont] = useState(true);
  const [isUsingDefaultFont, setIsUsingDefaultFont] = useState(false);
  
  // State for track selection
  const [tracks, setTracks] = useState([]);
  const [showTrackSelection, setShowTrackSelection] = useState(false);
  const [selectedTrackIndex, setSelectedTrackIndex] = useState(0);
  
  // State for export format
  const [exportFormat, setExportFormat] = useState('png');

  // Refs for file inputs and canvas
  const fileInputRef = useRef(null);
  const fontInputRef = useRef(null);
  const nfoInputRef = useRef(null);
  const canvasRef = useRef(null);

  // Button hover states
  const [exportBtnHover, setExportBtnHover] = useState(false);
  const [uploadImgBtnHover, setUploadImgBtnHover] = useState(false);
  const [uploadFontBtnHover, setUploadFontBtnHover] = useState(false);
  const [uploadNfoBtnHover, setUploadNfoBtnHover] = useState(false);

  // Function to load the default background image
  const loadDefaultBackground = () => {
    setIsLoadingDefaultBackground(true);
    
    // Create image element for the default background
    const img = new Image();
    img.onload = () => {
      setBackgroundImage(img);
      setIsLoadingDefaultBackground(false);
      setIsUsingDefaultBackground(true);
    };
    img.onerror = (error) => {
      console.error('Failed to load default background image:', error);
      setIsLoadingDefaultBackground(false);
      setIsUsingDefaultBackground(false);
      
      // Show error notification
      const errorNotification = document.createElement('div');
      errorNotification.style.position = 'fixed';
      errorNotification.style.bottom = '20px';
      errorNotification.style.right = '20px';
      errorNotification.style.backgroundColor = 'rgba(220, 38, 38, 0.8)';
      errorNotification.style.color = 'white';
      errorNotification.style.padding = '10px 20px';
      errorNotification.style.borderRadius = '5px';
      errorNotification.style.zIndex = '1000';
      errorNotification.textContent = 'Failed to load default background image. Please try uploading a custom image.';
      document.body.appendChild(errorNotification);
      
      // Remove notification after 5 seconds
      setTimeout(() => {
        if (document.body.contains(errorNotification)) {
          document.body.removeChild(errorNotification);
        }
      }, 5000);
    };
    
    // Set the source to the local background.jpeg file
    try {
      // Use a relative path from the public directory
      img.src = process.env.PUBLIC_URL + '/resources/templates/plushrecs/background.jpeg';
    } catch (error) {
      console.error('Error setting image source:', error);
      setIsLoadingDefaultBackground(false);
      setIsUsingDefaultBackground(false);
    }
  };
  
  // Function to load the default font
  const loadDefaultFont = () => {
    setIsLoadingDefaultFont(true);
    
    // The name to use for the default font
    const defaultFontName = 'PixelDigivolve';
    
    try {
      // Font URL from public directory
      const fontUrl = process.env.PUBLIC_URL + '/resources/templates/plushrecs/pixel-font.otf';
      
      // Create a new FontFace object
      fetch(fontUrl)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Failed to fetch font: ${response.status} ${response.statusText}`);
          }
          return response.arrayBuffer();
        })
        .then(buffer => {
          const fontFace = new FontFace(defaultFontName, buffer);
          return fontFace.load();
        })
        .then(loadedFace => {
          // Add font to document fonts
          document.fonts.add(loadedFace);
          
          // Update state with the default font information
          setCustomFont({
            loaded: true,
            name: defaultFontName,
            url: process.env.PUBLIC_URL + '/resources/templates/plushrecs/pixel-font.otf'
          });
          
          // Select the default font
          setTextStyles(prev => ({
            ...prev,
            fontFamily: defaultFontName
          }));
          
          setIsLoadingDefaultFont(false);
          setIsUsingDefaultFont(true);
          
          console.log('Default font loaded successfully');
        })
        .catch(error => {
          console.error('Error loading default font:', error);
          setIsLoadingDefaultFont(false);
          setIsUsingDefaultFont(false);
          
          // Show error notification
          const errorNotification = document.createElement('div');
          errorNotification.style.position = 'fixed';
          errorNotification.style.bottom = '20px';
          errorNotification.style.right = '20px';
          errorNotification.style.backgroundColor = 'rgba(220, 38, 38, 0.8)';
          errorNotification.style.color = 'white';
          errorNotification.style.padding = '10px 20px';
          errorNotification.style.borderRadius = '5px';
          errorNotification.style.zIndex = '1000';
          errorNotification.textContent = 'Failed to load default font. Please try uploading a custom font.';
          document.body.appendChild(errorNotification);
          
          // Remove notification after 5 seconds
          setTimeout(() => {
            if (document.body.contains(errorNotification)) {
              document.body.removeChild(errorNotification);
            }
          }, 5000);
        });
    } catch (error) {
      console.error('Error loading default font:', error);
      setIsLoadingDefaultFont(false);
      setIsUsingDefaultFont(false);
    }
  };

  // Load default background and font on component mount
  useEffect(() => {
    loadDefaultBackground();
    loadDefaultFont();
  }, []);

  // No need for the font notification anymore since we're auto-loading the font

  // Handle background image upload
  const handleImageUpload = (event) => {
    if (!event || !event.target || !event.target.files) {
      console.error('Invalid event or missing files');
      return;
    }

    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e && e.target && e.target.result) {
          const img = new Image();
          img.onload = () => {
            setBackgroundImage(img);
            setIsUsingDefaultBackground(false);
          };
          img.src = e.target.result;
        }
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Reset to default background
  const resetToDefaultBackground = () => {
    loadDefaultBackground();
  };

  // Handle text content change
  const handleTextChange = (field, value) => {
    setTextContent(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle text style change
  const handleStyleChange = (field, value) => {
    setTextStyles(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Trigger file input clicks
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const triggerFontInput = () => {
    if (fontInputRef.current) {
      fontInputRef.current.click();
    }
  };

  const triggerNfoInput = () => {
    if (nfoInputRef.current) {
      nfoInputRef.current.click();
    }
  };

  // Reset to default font
  const resetToDefaultFont = () => {
    loadDefaultFont();
  };
  
  // Parse NFO file content and extract information
  const parseNfoContent = (content) => {
    try {
      const lines = content.split('\n');
      let artist = '';
      let catalogNumber = '';
      let trackTitle = '';
      let allTracks = [];
      
      // Extract artist
      const artistLine = lines.find(line => line.trim().startsWith('Artist'));
      if (artistLine) {
        const artistMatch = artistLine.match(/Artist\s*:\s*(.+)/);
        if (artistMatch && artistMatch[1]) {
          artist = artistMatch[1].trim();
        }
      }
      
      // Extract catalog number
      const catLine = lines.find(line => line.trim().startsWith('Cat'));
      if (catLine) {
        const catMatch = catLine.match(/Cat\s*:\s*(.+)/);
        if (catMatch && catMatch[1]) {
          catalogNumber = catMatch[1].trim();
        }
      }
      
      // Extract all tracks
      let inTrackList = false;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Look for the Track List section
        if (line === 'Track List') {
          inTrackList = true;
          continue;
        }
        
        // Skip the divider line after 'Track List'
        if (inTrackList && line.startsWith('-')) {
          continue;
        }
        
        // Track format: "1. Track Title"
        if (inTrackList && line.match(/^\d+\.\s*.+/)) {
          const trackMatch = line.match(/^(\d+)\.\s*(.+)/);
          if (trackMatch && trackMatch[2]) {
            allTracks.push({
              number: parseInt(trackMatch[1], 10),
              title: trackMatch[2].trim()
            });
          }
        }
        
        // Exit track list section when we hit a blank line or new section
        if (inTrackList && (line === '' || line === 'Description')) {
          break;
        }
      }
      
      // Set the default track title to the first track if available
      if (allTracks.length > 0) {
        trackTitle = allTracks[0].title;
      }
      
      return { artist, catalogNumber, trackTitle, tracks: allTracks };
    } catch (error) {
      console.error('Error parsing NFO file:', error);
      return { artist: '', catalogNumber: '', trackTitle: '', tracks: [] };
    }
  };
  
  // Update title with selected track
  const selectTrack = (index) => {
    if (tracks[index]) {
      setTextContent(prev => ({
        ...prev,
        title: tracks[index].title
      }));
      setSelectedTrackIndex(index);
      
      // Show a notification
      const notification = document.createElement('div');
      notification.style.position = 'fixed';
      notification.style.bottom = '20px';
      notification.style.right = '20px';
      notification.style.backgroundColor = 'rgba(0, 128, 0, 0.8)';
      notification.style.color = 'white';
      notification.style.padding = '10px 20px';
      notification.style.borderRadius = '5px';
      notification.style.zIndex = '1000';
      notification.textContent = `Selected track: ${tracks[index].number}. ${tracks[index].title}`;
      document.body.appendChild(notification);
      
      // Remove notification after 3 seconds
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 3000);
    }
  };
  
  // Close track selection dialog
  const closeTrackSelection = () => {
    setShowTrackSelection(false);
  };
  
  // Handle NFO file upload
  const handleNfoUpload = (event) => {
    if (!event || !event.target || !event.target.files) {
      console.error('Invalid event or missing files');
      return;
    }
    
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e && e.target && e.target.result) {
          const content = e.target.result;
          const { artist, catalogNumber, trackTitle, tracks } = parseNfoContent(content);
          
          // Save tracks to state
          setTracks(tracks);
          setSelectedTrackIndex(0);
          
          // Update form fields with extracted data
          if (artist) {
            setTextContent(prev => ({
              ...prev,
              artist: artist
            }));
          }
          
          if (catalogNumber) {
            setTextContent(prev => ({
              ...prev,
              catalogNumber: catalogNumber
            }));
          }
          
          if (trackTitle) {
            setTextContent(prev => ({
              ...prev,
              title: trackTitle
            }));
          }
          
          // Show track selection if more than 2 tracks are found
          if (tracks.length > 2) {
            setShowTrackSelection(true);
          } else {
            setShowTrackSelection(false);
          }
          
          // Show success notification
          const successNotification = document.createElement('div');
          successNotification.style.position = 'fixed';
          successNotification.style.bottom = '20px';
          successNotification.style.right = '20px';
          successNotification.style.backgroundColor = 'rgba(0, 128, 0, 0.8)';
          successNotification.style.color = 'white';
          successNotification.style.padding = '10px 20px';
          successNotification.style.borderRadius = '5px';
          successNotification.style.zIndex = '1000';
          successNotification.textContent = `NFO file parsed successfully! ${artist ? 'Artist: ' + artist + '. ' : ''}${catalogNumber ? 'Cat: ' + catalogNumber + '. ' : ''}${tracks.length} tracks found.`;
          document.body.appendChild(successNotification);
          
          // Remove notification after 5 seconds
          setTimeout(() => {
            if (document.body.contains(successNotification)) {
              document.body.removeChild(successNotification);
            }
          }, 5000);
        }
      };
      reader.readAsText(file);
    }
  };
  
  // Handle custom font upload
  const handleFontUpload = (event) => {
    if (!event || !event.target || !event.target.files) {
      console.error('Invalid event or missing files');
      return;
    }

    const file = event.target.files[0];
    if (file) {
      // Generate a font name from the file name (without extension)
      const fontName = file.name.replace(/\.[^/.]+$/, "");

      const reader = new FileReader();
      reader.onload = (e) => {
        if (e && e.target && e.target.result) {
          const fontUrl = e.target.result;

          try {
            // Create a new FontFace object
            const fontFace = new FontFace(fontName, `url(${fontUrl})`);

            // Load the font and add it to the document
            fontFace.load().then(loadedFace => {
              document.fonts.add(loadedFace);

              // Update state with the new font information
              setCustomFont({
                loaded: true,
                name: fontName,
                url: fontUrl
              });

              // Automatically select the custom font
              setTextStyles(prev => ({
                ...prev,
                fontFamily: fontName
              }));
              
              // Mark as not using default font
              setIsUsingDefaultFont(false);

            }).catch(err => {
              console.error('Error loading font:', err);
              alert('Failed to load font. Please try a different font file.');

              setCustomFont({
                loaded: false,
                name: 'Error loading font',
                url: null
              });
            });
          } catch (error) {
            console.error('Font creation error:', error);
            alert('Failed to create font. Please try a different font file.');

            setCustomFont({
              loaded: false,
              name: 'Error creating font',
              url: null
            });
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle canvas drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#333';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw background image if available
    if (backgroundImage) {
      const scale = Math.max(
        canvas.width / backgroundImage.width,
        canvas.height / backgroundImage.height
      );

      const x = (canvas.width - backgroundImage.width * scale) / 2;
      const y = (canvas.height - backgroundImage.height * scale) / 2;

      ctx.drawImage(
        backgroundImage,
        x, y,
        backgroundImage.width * scale,
        backgroundImage.height * scale
      );
    }

    // Draw text
    ctx.fillStyle = textStyles.color;

    // Title
    try {
      ctx.font = `${textStyles.titleSize} ${textStyles.fontFamily}`;
      ctx.textAlign = 'left';
      ctx.fillText(textContent.title, 30, canvas.height - 40);
    } catch (e) {
      console.error('Error rendering title:', e);
      // Fallback to safe font
      ctx.font = `${textStyles.titleSize} sans-serif`;
      ctx.fillText(textContent.title, 30, canvas.height - 40);
    }

    // Artist
    try {
      ctx.font = `${textStyles.artistSize} ${textStyles.fontFamily}`;
      ctx.fillText(textContent.artist, 30, canvas.height - 20);
    } catch (e) {
      console.error('Error rendering artist:', e);
      ctx.font = `${textStyles.artistSize} sans-serif`;
      ctx.fillText(textContent.artist, 30, canvas.height - 20);
    }

    // Catalog number
    try {
      ctx.textAlign = 'right';
      ctx.font = `${textStyles.catalogNumberSize} ${textStyles.fontFamily}`;
      ctx.fillText(textContent.catalogNumber, canvas.width - 30, canvas.height - 20);
    } catch (e) {
      console.error('Error rendering catalog number:', e);
      ctx.font = `${textStyles.catalogNumberSize} sans-serif`;
      ctx.fillText(textContent.catalogNumber, canvas.width - 30, canvas.height - 20);
    }

  }, [backgroundImage, textContent, textStyles]);

  // Simplified export function that copies the visible canvas
  const exportImage = () => {
    console.log("Export button clicked");

    if (!canvasRef.current) {
      console.error("Canvas reference is null");
      alert("Cannot export: Canvas not initialized");
      return;
    }

    try {
      // Create a notification to show the export is in progress
      const loadingNotification = document.createElement('div');
      loadingNotification.style.position = 'fixed';
      loadingNotification.style.bottom = '20px';
      loadingNotification.style.right = '20px';
      loadingNotification.style.backgroundColor = 'rgba(59, 130, 246, 0.8)';
      loadingNotification.style.color = 'white';
      loadingNotification.style.padding = '10px 20px';
      loadingNotification.style.borderRadius = '5px';
      loadingNotification.style.zIndex = '1000';
      loadingNotification.textContent = 'Creating high-resolution image...';
      document.body.appendChild(loadingNotification);

      // Use a short timeout to ensure the UI is updated before the export starts
      setTimeout(() => {
        try {
          // Get the preview canvas context
          const previewCtx = canvasRef.current.getContext('2d');
          const previewData = previewCtx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);

          console.log("Creating high-resolution canvas");

          // Create temporary canvas at 3000x3000 resolution
          const highResCanvas = document.createElement('canvas');
          highResCanvas.width = 3000;
          highResCanvas.height = 3000;
          const highResCtx = highResCanvas.getContext('2d');

          if (!highResCtx) {
            throw new Error("Failed to get 2D context for high-res canvas");
          }

          // Fill background with same color as preview
          highResCtx.fillStyle = '#333';
          highResCtx.fillRect(0, 0, highResCanvas.width, highResCanvas.height);

          // Draw background image at high resolution if available
          if (backgroundImage) {
            console.log("Drawing background image");
            const scale = Math.max(
              highResCanvas.width / backgroundImage.width,
              highResCanvas.height / backgroundImage.height
            );

            const x = (highResCanvas.width - backgroundImage.width * scale) / 2;
            const y = (highResCanvas.height - backgroundImage.height * scale) / 2;

            highResCtx.drawImage(
              backgroundImage,
              x, y,
              backgroundImage.width * scale,
              backgroundImage.height * scale
            );
          }

          // Calculate scaling factor
          const scaleFactor = highResCanvas.width / canvasRef.current.width;

          // Directly draw text at high resolution with explicit font settings
          highResCtx.fillStyle = textStyles.color;

          // Calculate text positions and sizes
          const titleY = highResCanvas.height - 200;
          const textY = highResCanvas.height - 100;
          const titleX = 150;
          const artistX = 150;
          const catalogX = highResCanvas.width - 150;

          // Draw title
          console.log("Drawing title");
          const titleFontSize = Math.floor(parseInt(textStyles.titleSize) * 5);

          // First try with custom font, fall back to a web-safe font
          const fontFamilyToUse = customFont.loaded ? customFont.name : textStyles.fontFamily;

          try {
            highResCtx.font = `${titleFontSize}px ${fontFamilyToUse}`;
            highResCtx.textAlign = 'left';
            highResCtx.fillText(textContent.title, titleX, titleY);
            console.log(`Title drawn with font: ${highResCtx.font}`);
          } catch (e) {
            console.error('Error using custom font for title, falling back to sans-serif', e);
            highResCtx.font = `${titleFontSize}px sans-serif`;
            highResCtx.fillText(textContent.title, titleX, titleY);
          }

          // Draw artist
          console.log("Drawing artist");
          const artistFontSize = Math.floor(parseInt(textStyles.artistSize) * 5);
          try {
            highResCtx.font = `${artistFontSize}px ${fontFamilyToUse}`;
            highResCtx.textAlign = 'left';
            highResCtx.fillText(textContent.artist, artistX, textY);
            console.log(`Artist drawn with font: ${highResCtx.font}`);
          } catch (e) {
            console.error('Error using custom font for artist, falling back to sans-serif', e);
            highResCtx.font = `${artistFontSize}px sans-serif`;
            highResCtx.fillText(textContent.artist, artistX, textY);
          }

          // Draw catalog number
          console.log("Drawing catalog number");
          const catalogFontSize = Math.floor(parseInt(textStyles.catalogNumberSize) * 5);
          try {
            highResCtx.font = `${catalogFontSize}px ${fontFamilyToUse}`;
            highResCtx.textAlign = 'right';
            highResCtx.fillText(textContent.catalogNumber, catalogX, textY);
            console.log(`Catalog number drawn with font: ${highResCtx.font}`);
          } catch (e) {
            console.error('Error using custom font for catalog, falling back to sans-serif', e);
            highResCtx.font = `${catalogFontSize}px sans-serif`;
            highResCtx.fillText(textContent.catalogNumber, catalogX, textY);
          }

          // Create and trigger download
          console.log(`Generating ${exportFormat.toUpperCase()} data URL`);
          const mimeType = exportFormat === 'jpg' ? 'image/jpeg' : 'image/png';
          const quality = exportFormat === 'jpg' ? 0.9 : undefined; // 90% quality for JPEG
          const dataUrl = highResCanvas.toDataURL(mimeType, quality);
          const fileName = `${textContent.artist}-${textContent.title}.${exportFormat.toLowerCase()}`;

          const link = document.createElement('a');
          link.download = fileName;
          link.href = dataUrl;
          document.body.appendChild(link);

          // Trigger download
          link.click();
          document.body.removeChild(link);

          // Remove loading notification
          if (document.body.contains(loadingNotification)) {
            document.body.removeChild(loadingNotification);
          }

          // Show success notification
          const successNotification = document.createElement('div');
          successNotification.style.position = 'fixed';
          successNotification.style.bottom = '20px';
          successNotification.style.right = '20px';
          successNotification.style.backgroundColor = 'rgba(0, 128, 0, 0.8)';
          successNotification.style.color = 'white';
          successNotification.style.padding = '10px 20px';
          successNotification.style.borderRadius = '5px';
          successNotification.style.zIndex = '1000';
          successNotification.textContent = `High-resolution ${exportFormat.toUpperCase()} (3000×3000) exported successfully!`;
          document.body.appendChild(successNotification);

          // Remove success notification after 3 seconds
          setTimeout(() => {
            if (document.body.contains(successNotification)) {
              document.body.removeChild(successNotification);
            }
          }, 3000);

        } catch (error) {
          console.error('Error during export operation:', error);

          // Remove loading notification
          if (document.body.contains(loadingNotification)) {
            document.body.removeChild(loadingNotification);
          }

          // Show error notification
          alert('Error exporting image: ' + error.message);
        }
      }, 100);

    } catch (error) {
      console.error('Error initiating export:', error);
      alert('Failed to initiate export: ' + error.message);
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <h1 style={styles.title}>Album Cover Creator</h1>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <select 
            value={exportFormat} 
            onChange={(e) => setExportFormat(e.target.value)}
            style={{
              backgroundColor: '#111',
              color: 'white',
              border: '1px solid #333',
              borderRadius: '4px',
              padding: '8px',
              marginRight: '8px',
              cursor: 'pointer'
            }}
          >
            <option value="png">PNG</option>
            <option value="jpg">JPG</option>
          </select>
          <button
            onClick={() => exportImage()}
            style={{
              ...styles.button,
              ...(exportBtnHover ? styles.buttonHover : {})
            }}
            onMouseEnter={() => setExportBtnHover(true)}
            onMouseLeave={() => setExportBtnHover(false)}
          >
            <Download size={16} style={{marginRight: '4px'}} /> Export (3000×3000)
          </button>
        </div>
      </header>

      <div style={styles.contentContainer}>
        {/* Tools panel */}
        <div style={styles.toolsPanel}>
          <div style={styles.sectionContainer}>
            <h2 style={styles.sectionTitle}>
              <Upload size={16} style={{marginRight: '4px'}} /> Background
            </h2>
            <button
              onClick={triggerFileInput}
              style={{
                ...styles.uploadButton,
                ...(uploadImgBtnHover ? styles.uploadButtonHover : {})
              }}
              onMouseEnter={() => setUploadImgBtnHover(true)}
              onMouseLeave={() => setUploadImgBtnHover(false)}
            >
              Upload Custom Image
            </button>
            
            {!isUsingDefaultBackground && backgroundImage && (
              <button
                onClick={resetToDefaultBackground}
                style={{
                  ...styles.uploadButton,
                  ...(resetBtnHover ? styles.uploadButtonHover : {}),
                  marginTop: '8px'
                }}
                onMouseEnter={() => setResetBtnHover(true)}
                onMouseLeave={() => setResetBtnHover(false)}
              >
                Reset to Default Background
              </button>
            )}
            
            {isLoadingDefaultBackground ? (
              <div style={styles.smallText}>Loading default background...</div>
            ) : isUsingDefaultBackground ? (
              <div style={styles.notificationSuccess}>Using default background image</div>
            ) : null}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={styles.hidden}
            />
          </div>

          <div style={styles.sectionContainer}>
            <h2 style={styles.sectionTitle}>
              <FileText size={16} style={{marginRight: '4px'}} /> NFO Parser
            </h2>
            <button
              onClick={triggerNfoInput}
              style={{
                ...styles.uploadButton,
                ...(uploadNfoBtnHover ? styles.uploadButtonHover : {})
              }}
              onMouseEnter={() => setUploadNfoBtnHover(true)}
              onMouseLeave={() => setUploadNfoBtnHover(false)}
            >
              Upload NFO File
            </button>
            <div style={styles.smallText}>
              Upload a .NFO file to automatically extract artist, catalog number, and track information.
            </div>
            <input
              ref={nfoInputRef}
              type="file"
              accept=".nfo,.txt"
              onChange={handleNfoUpload}
              style={styles.hidden}
            />
          </div>

          <div style={styles.sectionContainer}>
            <h2 style={styles.sectionTitle}>
              <FileType size={16} style={{marginRight: '4px'}} /> Custom Font
            </h2>
            <button
              onClick={triggerFontInput}
              style={{
                ...styles.uploadButton,
                ...(uploadFontBtnHover ? styles.uploadButtonHover : {})
              }}
              onMouseEnter={() => setUploadFontBtnHover(true)}
              onMouseLeave={() => setUploadFontBtnHover(false)}
            >
              Upload Custom Font (.otf, .ttf)
            </button>
            <div style={styles.smallText}>
              Default pixel font will be loaded automatically.
            </div>
            <input
              ref={fontInputRef}
              type="file"
              accept=".otf,.ttf"
              onChange={handleFontUpload}
              style={styles.hidden}
            />
            
            {!isUsingDefaultFont && customFont.loaded && (
              <button
                onClick={resetToDefaultFont}
                style={{
                  ...styles.uploadButton,
                  ...(resetBtnHover ? styles.uploadButtonHover : {}),
                  marginTop: '8px'
                }}
                onMouseEnter={() => setResetBtnHover(true)}
                onMouseLeave={() => setResetBtnHover(false)}
              >
                Reset to Default Font
              </button>
            )}
            
            {isLoadingDefaultFont ? (
              <div style={styles.smallText}>Loading default font...</div>
            ) : isUsingDefaultFont ? (
              <div style={styles.notificationSuccess}>
                <span style={{fontSize: '14px', display: 'block', marginBottom: '4px'}}>Default font loaded:</span>
                <span style={{fontFamily: customFont.name, fontWeight: 500}}>
                  {customFont.name}
                </span>
              </div>
            ) : customFont.loaded && (
              <div style={styles.notificationSuccess}>
                <span style={{fontSize: '14px', display: 'block', marginBottom: '4px'}}>Custom font loaded:</span>
                <span style={{fontFamily: customFont.name, fontWeight: 500}}>
                  {customFont.name}
                </span>
              </div>
            )}
            {!customFont.loaded && !isUsingDefaultFont && customFont.name && (
              <div style={styles.notificationPending}>
                <span style={{fontSize: '14px'}}>{customFont.name}</span>
              </div>
            )}
          </div>

          <div style={styles.sectionContainer}>
            <h2 style={styles.sectionTitle}>
              <Type size={16} style={{marginRight: '4px'}} /> Text Content
            </h2>
            <div>
              <label style={styles.labelText}>Title</label>
              <input
                type="text"
                value={textContent.title}
                onChange={(e) => handleTextChange('title', e.target.value)}
                style={styles.input}
              />
            </div>
            <div>
              <label style={styles.labelText}>Artist</label>
              <input
                type="text"
                value={textContent.artist}
                onChange={(e) => handleTextChange('artist', e.target.value)}
                style={styles.input}
              />
            </div>
            <div>
              <label style={styles.labelText}>Catalog Number</label>
              <input
                type="text"
                value={textContent.catalogNumber}
                onChange={(e) => handleTextChange('catalogNumber', e.target.value)}
                style={styles.input}
              />
            </div>
          </div>

          <div>
            <h2 style={styles.sectionTitle}>
              <Sliders size={16} style={{marginRight: '4px'}} /> Text Style
            </h2>
            <div>
              <label style={styles.labelText}>Font Family</label>
              <select
                value={textStyles.fontFamily}
                onChange={(e) => handleStyleChange('fontFamily', e.target.value)}
                style={styles.select}
              >
                {customFont.loaded && (
                  <option value={customFont.name} style={{ fontFamily: customFont.name }}>
                    {customFont.name} (Custom)
                  </option>
                )}
                <option value="monospace">Monospace</option>
                <option value="sans-serif">Sans Serif</option>
                <option value="serif">Serif</option>
                <option value="'Courier New', monospace">Courier New</option>
                <option value="'Arial', sans-serif">Arial</option>
                <option value="'Helvetica', sans-serif">Helvetica</option>
              </select>
            </div>
            <div>
              <label style={styles.labelText}>Title Size</label>
              <select
                value={textStyles.titleSize}
                onChange={(e) => handleStyleChange('titleSize', e.target.value)}
                style={styles.select}
              >
                <option value="20px">Small</option>
                <option value="28px">Medium</option>
                <option value="36px">Large</option>
                <option value="48px">X-Large</option>
              </select>
            </div>
            <div>
              <label style={styles.labelText}>Artist Size</label>
              <select
                value={textStyles.artistSize}
                onChange={(e) => handleStyleChange('artistSize', e.target.value)}
                style={styles.select}
              >
                <option value="20px">Small</option>
                <option value="28px">Medium</option>
                <option value="36px">Large</option>
                <option value="48px">X-Large</option>
              </select>
            </div>
            <div>
              <label style={styles.labelText}>Catalog Number Size</label>
              <select
                value={textStyles.catalogNumberSize}
                onChange={(e) => handleStyleChange('catalogNumberSize', e.target.value)}
                style={styles.select}
              >
                <option value="20px">Small</option>
                <option value="28px">Medium</option>
                <option value="36px">Large</option>
                <option value="48px">X-Large</option>
              </select>
            </div>
            <div>
              <label style={styles.labelText}>Text Color</label>
              <input
                type="color"
                value={textStyles.color}
                onChange={(e) => handleStyleChange('color', e.target.value)}
                style={styles.colorInput}
              />
            </div>
          </div>
        </div>

        {/* Canvas preview area */}
        <div style={styles.canvasContainer}>
          <div style={styles.canvasWrapper}>
            <canvas
              ref={canvasRef}
              width={600}
              height={600}
              style={styles.canvas}
            />
          </div>
          
          {/* Track selection dialog */}
          {showTrackSelection && tracks.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              borderRadius: '8px',
              padding: '20px',
              minWidth: '350px',
              boxShadow: '0 8px 16px rgba(0, 0, 0, 0.3)',
              zIndex: 10,
              border: '1px solid #374151'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px'
              }}>
                <h3 style={{
                  margin: 0,
                  fontSize: '18px',
                  fontWeight: 'bold'
                }}>Select Track</h3>
                <button 
                  onClick={closeTrackSelection}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: 'white',
                    fontSize: '20px',
                    cursor: 'pointer',
                    padding: '0 8px'
                  }}
                >
                  ×
                </button>
              </div>
              
              <div style={{
                maxHeight: '300px',
                overflowY: 'auto',
                marginBottom: '16px'
              }}>
                {tracks.map((track, index) => (
                  <div 
                    key={index}
                    onClick={() => selectTrack(index)}
                    style={{
                      padding: '8px 12px',
                      margin: '4px 0',
                      backgroundColor: selectedTrackIndex === index ? '#2563eb' : '#374151',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s ease'
                    }}
                  >
                    <span style={{fontWeight: 'bold'}}>{track.number}.</span> {track.title}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlbumCoverCreator;
 // Initialize Vanta.js waves effect
VANTA.WAVES({
    el: "#vanta-waves",
    mouseControls: true,
    touchControls: true,
    gyroControls: false,
    minHeight: 200.00,
    minWidth: 200.00,
    scale: 1.00,
    scaleMobile: 1.00,
    color: 0xff7b00,
    shininess: 35.00,
    waveHeight: 15.00,
    waveSpeed: 0.85,
    zoom: 0.85
});

// Mobile menu toggle
document.querySelector('button[aria-controls="mobile-menu"]').addEventListener('click', function() {
    const mobileMenu = document.getElementById('mobile-menu');
    mobileMenu.classList.toggle('hidden');
});

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            targetElement.scrollIntoView({
                behavior: 'smooth'
            });
            
            // Close mobile menu if open
            const mobileMenu = document.getElementById('mobile-menu');
            if (!mobileMenu.classList.contains('hidden')) {
                mobileMenu.classList.add('hidden');
            }
        }
    });
});


window.addEventListener('load', () => {
    const mapDiv = document.getElementById('map');
    const loadingDiv = document.getElementById('map-loading');
    
    // Create iframe dynamically
    const iframe = document.createElement('iframe');
    iframe.src = 'https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d467874.0376686858!2d29.5474543!3d-23.630646!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1ec6f26c079be0d3%3A0x4a0264e9a64e5813!2sSekwa%20Jjj!5e0!3m2!1sen!2sza!4v1760944605110!5m2!1sen!2sza';
    iframe.width = '100%';
    iframe.height = '100%';
    iframe.style.border = '0';
    iframe.allowFullscreen = true;
    iframe.loading = 'lazy';
    iframe.referrerPolicy = 'no-referrer-when-downgrade';

    // Hide loading indicator when iframe loads
    iframe.addEventListener('load', () => {
    loadingDiv.style.display = 'none';
    });

    // Append iframe to map container
    mapDiv.appendChild(iframe);
});

async function loadPortfolio() {
  try {
    const response = await fetch('/.netlify/functions/images');
    const images = await response.json();

    // Group images by category
    const grouped = images.reduce((acc, img) => {
      const cat = img.category || 'other';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(img);
      return acc;
    }, {});

    const categoryGrid = document.getElementById('category-grid');
    const lightboxContainer = document.getElementById('lightbox-gallery');
    categoryGrid.innerHTML = '';
    lightboxContainer.innerHTML = '';

    // Capitalize category names
    const categoryNames = {
      photography: 'Photography',
      videography: 'Videography',
      printing: 'Printing',
      design: 'Graphic Design',
      other: 'Other'
    };

    Object.keys(grouped).forEach(category => {
      const firstImg = grouped[category][0];

      // Create category thumbnail
      const div = document.createElement('div');
      div.className = 'relative overflow-hidden rounded-lg shadow-xl group cursor-pointer';
      div.onclick = () => openCategoryLightbox(category, grouped[category]);

      div.innerHTML = `
        <img src="${firstImg.url}" alt="${categoryNames[category] || category}"
             class="w-full h-64 object-cover transition duration-500 group-hover:scale-110">
        <div class="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
          <div class="text-center">
            <h3 class="text-2xl font-bold text-white mb-2">${categoryNames[category] || category}</h3>
            <p class="text-primary-500 font-medium">${grouped[category].length} images</p>
            <i data-feather="eye" class="w-10 h-10 text-primary-500 mx-auto mt-4"></i>
          </div>
        </div>
      `;
      categoryGrid.appendChild(div);

      // Add all images in this category to hidden lightbox
      grouped[category].forEach(img => {
        const a = document.createElement('a');
        a.href = img.url;
        a.setAttribute('data-lightbox', 'portfolio');
        a.setAttribute('data-title', img.alt_text || categoryNames[category]);
        a.style.display = 'none';
        lightboxContainer.appendChild(a);
      });
    });

    feather.replace();
  } catch (error) {
    console.error('Error loading portfolio:', error);
  }
  
  feather.replace();
}

function openCategoryLightbox(category, images) {
  // Trigger click on the first image of this category to open lightbox
  const firstLink = Array.from(document.querySelectorAll('#lightbox-gallery a'))
    .find(a => a.href === images[0].url);
  if (firstLink) firstLink.click();
}

// Initialise Lightbox2 properly
lightbox.option({
  'resizeDuration': 200,
  'wrapAround': true,
  'albumLabel': 'Image %1 of %2'
});

// Load on page load
document.addEventListener('DOMContentLoaded', loadPortfolio);

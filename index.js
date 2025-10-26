window.cartManager = {
    cart: {
        items: [],
        shippingGoal: 9500
    },

    // --- FONCTIONS DE MISE À JOUR DU PANIER ---
    calculateSubtotal: function() {
        return this.cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    },

    formatPrice: function(amount) {
        return `DA ${amount.toLocaleString('fr-DZ')} DZD`;
    },

    updateShippingProgress: function(subtotal) {
        const goal = this.cart.shippingGoal;
        const progressElement = document.getElementById('shippingProgress');
        
        let message, progressWidth;

        if (subtotal >= goal) {
            message = `<strong style="font-size: 14px;">Félicitations ! Vous bénéficiez de la livraison gratuite ! 🎉</strong>`;
            progressWidth = 100;
        } else {
            const needed = goal - subtotal;
            message = `
                <strong style="font-size: 14px;">Dépenser ${this.formatPrice(goal).replace(' DZD', '')} & Profitez D'Une Livraison</strong>
                Gratuite<br>Il vous manque ${this.formatPrice(needed)}`;
            progressWidth = (subtotal / goal) * 100;
            progressWidth = Math.min(progressWidth, 99);
        }

        progressElement.innerHTML = `
            <div class="shipping-goal">
                ${message}
            </div>
            <div class="progress-bar-container">
                <div class="progress-bar-fill" style="width: ${progressWidth}%;"></div>
            </div>
        `;
    },
    
    renderCartItems: function() {
        const itemsContainer = document.getElementById('cartItems');
        itemsContainer.innerHTML = '';

        if (this.cart.items.length === 0) {
            document.getElementById('emptyCartMessage').style.display = 'block';
            document.getElementById('specialInstructionsSection').style.display = 'none';
            return;
        }

        document.getElementById('emptyCartMessage').style.display = 'none';
        document.getElementById('specialInstructionsSection').style.display = 'block';

        this.cart.items.forEach(item => {
            const itemTotal = item.price * item.quantity;
            const currentImageIndex = item.currentImageIndex || 0;
            
            const itemHTML = `
                <div class="cart-item" data-item-id="${item.id}">
                    <div class="item-details-wrapper">
                        <div class="item-image">
                            <img src="${item.images[currentImageIndex]}" alt="${item.name}">
                            <div class="image-navigation">
                                ${item.images.map((_, index) => `
                                    <div class="image-dot ${index === currentImageIndex ? 'active' : ''}" data-item-id="${item.id}" data-index="${index}"></div>
                                `).join('')}
                            </div>
                        </div>
                        <div class="item-info">
                            <div class="item-name">${item.name}</div>
                            <div class="item-variant">${item.variant || 'Standard'}</div>
                            <div class="item-quantity-controls">
                                <button class="quantity-btn minus-btn" data-id="${item.id}" data-action="decrease">-</button>
                                <span class="quantity-value">${item.quantity}</span>
                                <button class="quantity-btn plus-btn" data-id="${item.id}" data-action="increase">+</button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="right-column-controls">
                        <svg xmlns="http://www.w3.org/2000/svg" class="remove-item-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" data-id="${item.id}" data-action="remove">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.86 10.9A2 2 0 0116.03 21H7.97a2 2 0 01-1.99-2.09L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3"/>
                        </svg>
                        <div class="item-price">${this.formatPrice(itemTotal).replace(' DZD', '')}</div>
                    </div>
                </div>
            `;
            itemsContainer.insertAdjacentHTML('beforeend', itemHTML);
        });
        
        // Ajouter les événements pour la navigation d'images dans le panier
        document.querySelectorAll('.image-dot').forEach(dot => {
            dot.addEventListener('click', (e) => {
                e.stopPropagation();
                const itemId = dot.dataset.itemId;
                const imageIndex = parseInt(dot.dataset.index);
                
                // Mettre à jour l'index de l'image pour cet article
                const item = this.cart.items.find(i => i.id === itemId);
                if (item) {
                    item.currentImageIndex = imageIndex;
                    
                    // Mettre à jour l'image affichée
                    const itemElement = document.querySelector(`.cart-item[data-item-id="${itemId}"]`);
                    if (itemElement) {
                        const imgElement = itemElement.querySelector('.item-image img');
                        imgElement.src = item.images[imageIndex];
                        
                        // Mettre à jour les indicateurs
                        const dots = itemElement.querySelectorAll('.image-dot');
                        dots.forEach((d, index) => {
                            if (index === imageIndex) {
                                d.classList.add('active');
                            } else {
                                d.classList.remove('active');
                            }
                        });
                    }
                }
            });
        });
    },

    updateCartUI: function() {
        const subtotal = this.calculateSubtotal();
        const itemCount = this.cart.items.reduce((total, item) => total + item.quantity, 0);

        document.getElementById('cartCount').textContent = itemCount;
        document.getElementById('sidebarCartCount').textContent = itemCount;

        this.renderCartItems();

        document.getElementById('subtotalAmount').textContent = this.formatPrice(subtotal);
        this.updateShippingProgress(subtotal);

        const footer = document.getElementById('cartFooter');
        const instructions = document.getElementById('specialInstructionsSection');
        if (this.cart.items.length > 0) {
            footer.style.display = 'block';
        } else {
            footer.style.display = 'none';
            instructions.style.display = 'none';
        }

        this.attachCartEventListeners();
        this.saveCartToLocalStorage();
    },

    // --- LOGIQUE D'AJOUT AU PANIER ---
    addToCart: function(product) {
        const existingItem = this.cart.items.find(item => item.id === product.id);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.cart.items.push({
                id: product.id,
                name: product.name,
                variant: product.variant || 'Standard',
                price: product.price,
                quantity: 1,
                images: product.images,
                currentImageIndex: 0
            });
        }
        
        this.updateCartUI();
        this.openCart();
        this.showAddToCartConfirmation(product.name);
    },

    showAddToCartConfirmation: function(productName) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: var(--primary-color-cart);
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 3000;
            font-weight: 500;
            transition: transform 0.3s, opacity 0.3s;
            transform: translateX(100%);
            opacity: 0;
        `;
        notification.textContent = `✓ ${productName} ajouté au panier`;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
            notification.style.opacity = '1';
        }, 100);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    },

    // --- LOGIQUE DU PANIER ---
    updateItemQuantity: function(itemId, action) {
        const item = this.cart.items.find(i => i.id === itemId);
        if (!item) return;

        if (action === 'increase') {
            item.quantity++;
        } else if (action === 'decrease') {
            item.quantity = Math.max(1, item.quantity - 1);
        } else if (action === 'remove') {
            this.cart.items = this.cart.items.filter(i => i.id !== itemId);
        }

        this.updateCartUI();
    },

    attachCartEventListeners: function() {
        const cartItemsContainer = document.getElementById('cartItems');

        cartItemsContainer.querySelectorAll('.quantity-btn, .remove-item-icon').forEach(element => {
            element.removeEventListener('click', this.handleCartAction);
        });

        cartItemsContainer.querySelectorAll('.quantity-btn, .remove-item-icon').forEach(element => {
            element.addEventListener('click', this.handleCartAction.bind(this));
        });
    },

    handleCartAction: function(event) {
        const id = event.currentTarget.dataset.id;
        const action = event.currentTarget.dataset.action;
        this.updateItemQuantity(id, action);
    },
    
    // --- GESTION DU LOCALSTORAGE ---
    saveCartToLocalStorage: function() {
        localStorage.setItem('maa_luxury_cart', JSON.stringify(this.cart));
    },
    
    loadCartFromLocalStorage: function() {
        const savedCart = localStorage.getItem('maa_luxury_cart');
        if (savedCart) {
            this.cart = JSON.parse(savedCart);
            this.updateCartUI();
        }
    },
    
    // --- LOGIQUE SIDEBAR ET TOGGLE ---
    openCart: function() {
        const cartSidebar = document.getElementById('cartSidebar');
        const cartOverlay = document.getElementById('cartOverlay');
        cartSidebar.classList.add('active');
        cartOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        this.updateCartUI();
    },

    closeCartSidebar: function() {
        const cartSidebar = document.getElementById('cartSidebar');
        const cartOverlay = document.getElementById('cartOverlay');
        cartSidebar.classList.remove('active');
        cartOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }
};

// Initialisation au chargement du document
document.addEventListener('DOMContentLoaded', function() {
    window.cartManager.loadCartFromLocalStorage();
    
    const cartToggle = document.querySelectorAll('.cart-toggle');
    const closeCart = document.getElementById('closeCart');
    const cartOverlay = document.getElementById('cartOverlay');

    cartToggle.forEach(btn => btn.addEventListener('click', () => window.cartManager.openCart()));
    closeCart.addEventListener('click', () => window.cartManager.closeCartSidebar());
    cartOverlay.addEventListener('click', () => window.cartManager.closeCartSidebar());

    // --- LOGIQUE INSTRUCTIONS SPÉCIALES ---
    const instructionsPlaceholder = document.getElementById('instructionsPlaceholder');
    const instructionsInput = document.getElementById('instructionsInput');
    
    if (instructionsPlaceholder) {
        instructionsPlaceholder.addEventListener('click', () => {
            instructionsPlaceholder.style.display = 'none';
            instructionsInput.style.display = 'block';
            instructionsInput.focus();
        });
    }
    
    // --- LOGIQUE MENU MOBILE ET RECHERCHE ---
    const toggle = document.querySelector('.menu-toggle');
    const mobileMenu = document.querySelector('.mobile-menu');
    const closeMenu = document.querySelector('.close-menu');
    const overlay = document.querySelector('.mobile-menu-overlay');
    const searchToggle = document.querySelectorAll('.search-toggle');
    const searchPopup = document.querySelector('.search-popup');
    const closeSearch = document.querySelector('.close-search');

    const openMobileMenu = () => {
        mobileMenu.classList.add('active');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    const closeMobileMenu = () => {
        mobileMenu.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    };

    const openSearch = () => {
        if (searchPopup) {
            searchPopup.classList.add('active');
            setTimeout(() => {
                const searchInput = searchPopup.querySelector('input[type="search"]');
                if (searchInput) searchInput.focus();
            }, 100);
        }
    };

    const closeSearchPopup = () => {
        if (searchPopup) {
            searchPopup.classList.remove('active');
        }
    };

    // Événements du Menu mobile
    if (toggle) toggle.addEventListener('click', openMobileMenu);
    if (closeMenu) closeMenu.addEventListener('click', closeMobileMenu);
    if (overlay) overlay.addEventListener('click', closeMobileMenu);

    const mobileLinks = document.querySelectorAll('.nav-mobile a');
    mobileLinks.forEach(link => link.addEventListener('click', closeMobileMenu));

    // Événements de la Recherche
    searchToggle.forEach(btn => btn.addEventListener('click', openSearch));
    if (closeSearch) closeSearch.addEventListener('click', closeSearchPopup);

    // Fermer la recherche avec la touche Échap
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeSearchPopup();
            closeMobileMenu();
            window.cartManager.closeCartSidebar();
            closeProductDetails();
            closeMobileFilter();
        }
    });
    
    // Événements pour les filtres desktop
    document.getElementById('en-stock').addEventListener('change', function() {
        activeFilters.inStock = this.checked;
        applyFilters();
    });

    document.getElementById('rupture').addEventListener('change', function() {
        activeFilters.outOfStock = this.checked;
        applyFilters();
    });

    document.getElementById('applyPriceFilter').addEventListener('click', function() {
        const minPrice = parseInt(document.getElementById('price-min').value) || 0;
        const maxPrice = parseInt(document.getElementById('price-max').value) || 36200;
        
        activeFilters.minPrice = minPrice;
        activeFilters.maxPrice = maxPrice;
        
        applyFilters();
    });

    // Événements pour les filtres mobile
    document.getElementById('mobile-en-stock').addEventListener('change', function() {
        activeFilters.inStock = this.checked;
    });

    document.getElementById('mobile-rupture').addEventListener('change', function() {
        activeFilters.outOfStock = this.checked;
    });

    document.getElementById('mobile-applyPriceFilter').addEventListener('click', function() {
        const minPrice = parseInt(document.getElementById('mobile-price-min').value) || 0;
        const maxPrice = parseInt(document.getElementById('mobile-price-max').value) || 36200;
        
        activeFilters.minPrice = minPrice;
        activeFilters.maxPrice = maxPrice;
    });

    document.getElementById('mobileApplyFilters').addEventListener('click', applyFilters);
    document.getElementById('mobileClearFilters').addEventListener('click', clearAllFilters);

    // Événement pour ouvrir le menu de filtres mobile
    document.getElementById('mobileFilterToggle').addEventListener('click', openMobileFilter);

    // Événement pour fermer le menu de filtres mobile
    document.getElementById('closeMobileFilter').addEventListener('click', closeMobileFilter);
    document.getElementById('mobileFilterOverlay').addEventListener('click', closeMobileFilter);

    // Événement pour le tri
    document.getElementById('mobileSortSelect').addEventListener('change', applyFilters);
});

// Rendre la fonction addToCart disponible globalement pour les autres scripts
window.addToCart = function(product) {
    window.cartManager.addToCart(product);
};


//hero 


document.addEventListener("DOMContentLoaded", () => {
    const slides = document.querySelectorAll(".hero-image");
    const dots = document.querySelectorAll(".dot");
    
    // --- NOUVEAU : Sélection des éléments de contenu ---
    const titleElement = document.querySelector('.hero-content h1');
    const paragraphElement = document.querySelector('.hero-content p');
    const buttonElement = document.querySelector('.hero-btn');

    // --- NOUVEAU : Tableau avec le contenu pour chaque slide ---
    const slideContent = [
        {
            title: "UN CADEAU <br> POUR LA VIE",
            paragraph: "OFFREZ UNE ÉLÉGANCE INTEMPORELLE AVEC NOS MONTRES DE QUALITÉ, CONÇUS POUR ÊTRE TRANSMIS DE GÉNÉRATION EN GÉNÉRATION.",
            buttonText: "COMMANDER MAINTENANT",
            buttonLink: "/allproduits.html"
        },
        {
            title: "Montre",
            paragraph: "Montre en acier inoxydable, soigneusement conçue pour refléter l’élégance et la perfection.",
            buttonText: "JE DÉCOUVRE",
            buttonLink: "/allproduits.html" // Lien d'exemple pour le second bouton
        }
    ];

    let current = 0;
    let isSliding = false; 

    // --- NOUVEAU : Fonction pour mettre à jour le texte ---
    function updateContent(index) {
        const content = slideContent[index];
        titleElement.innerHTML = content.title; // innerHTML pour conserver le <br>
        paragraphElement.textContent = content.paragraph;
        buttonElement.innerHTML = `${content.buttonText} <svg xmlns="http://www.w3.org/2000/svg" class="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>`; // On réinsère le SVG
        buttonElement.href = content.buttonLink;
    }

    // 1. Initialisation: S'assurer que la première image est bien visible au départ.
    slides[0].style.transform = "translateX(0)";
    slides[0].classList.add("active");
    updateContent(0); // Initialiser le contenu du premier slide

    function showSlide(newIndex) {
        if (isSliding || newIndex === current) return;
        isSliding = true;

        const oldSlide = slides[current];
        const newSlide = slides[newIndex];
        
        // Déterminer la direction de glissement : 'right' si on avance (newIndex > current)
        const direction = (newIndex > current) ? 'right' : 'left';
        
        // 1. Positionner la nouvelle slide hors écran
        newSlide.style.transform = direction === 'right' ? 'translateX(100%)' : 'translateX(-100%)';
        newSlide.classList.add("active"); 

        // 2. Lancer la transition après un micro-délai
        setTimeout(() => {
            oldSlide.style.transform = direction === 'right' ? 'translateX(-100%)' : 'translateX(100%)';
            newSlide.style.transform = 'translateX(0)';
        }, 50); 

        // Mettre à jour les indicateurs
        dots[current].classList.remove("active");
        dots[newIndex].classList.add("active");
        
        // --- NOUVEAU : Mettre à jour le contenu en même temps ---
        updateContent(newIndex);
        
        // 3. Nettoyer les anciennes slides après la fin de la transition
        newSlide.addEventListener('transitionend', function handler() {
            oldSlide.classList.remove("active");
            oldSlide.style.transform = 'translateX(100%)'; 
            isSliding = false;
            newSlide.removeEventListener('transitionend', handler);
        });

        current = newIndex;
    }

    dots.forEach(dot => {
        dot.addEventListener("click", () => {
            showSlide(parseInt(dot.dataset.index));
        });
    });
});

// products 

document.addEventListener("DOMContentLoaded", function() {
  const categoriesWrapper = document.querySelector(".categories-wrapper");
  const categories = document.querySelector(".categories");
  const categoriesContainer = document.querySelector(".categories-container");
  const leftArrow = document.querySelector(".arrow.left");
  const rightArrow = document.querySelector(".arrow.right");
  const categoryItems = document.querySelectorAll(".category");
  
  // Si pas d'éléments, on sort
  if (categoryItems.length === 0) return;

  let currentPosition = 0;

  // Fonction pour obtenir la largeur visible et la taille du pas de défilement
  function getSlideMetrics() {
    const itemWidth = categoryItems[0].offsetWidth;
    // On vérifie le style appliqué pour la gap (espace entre les éléments)
    const gapStyle = window.getComputedStyle(categories).getPropertyValue('gap');
    const gap = parseFloat(gapStyle); 
    const stepWidth = itemWidth + gap;
    
    // Nombre d'éléments visibles (calcul basé sur le conteneur)
    const visibleWidth = categoriesContainer.offsetWidth;
    const visibleCategories = Math.floor((visibleWidth + gap) / stepWidth);
    
    return { 
      // La taille du pas de défilement est un 'bloc' visible d'éléments
      stepWidth: stepWidth * visibleCategories, 
      maxPosition: (categoryItems.length * stepWidth) - visibleWidth - gap,
      visibleCategories: visibleCategories
    };
  }

  // Fonction pour mettre à jour l'état des flèches et la position max
  function updateArrows() {
    const { maxPosition, visibleCategories } = getSlideMetrics();
    
    // Si tous les éléments sont visibles, désactiver les deux flèches
    if (visibleCategories >= categoryItems.length) {
      leftArrow.disabled = true;
      rightArrow.disabled = true;
      leftArrow.style.background = '#ccc';
      rightArrow.style.background = '#ccc';
      return;
    }

    // S'assurer que currentPosition ne dépasse pas maxPosition après un redimensionnement
    if (currentPosition > maxPosition) {
        currentPosition = maxPosition > 0 ? maxPosition : 0; // S'assure de ne pas avoir de position négative si maxPosition est petit
        categories.style.transform = `translateX(-${currentPosition}px)`;
    }
    if (currentPosition < 0) {
      currentPosition = 0;
      categories.style.transform = `translateX(-${currentPosition}px)`;
    }

    // Désactiver la flèche gauche : si on est au début (position 0)
    leftArrow.disabled = currentPosition <= 1;
    
    // Désactiver la flèche droite : si on est à la fin (position >= maxPosition)
    rightArrow.disabled = currentPosition >= maxPosition - 1;
    
    // Mise à jour visuelle des flèches
    leftArrow.style.background = leftArrow.disabled ? '#ccc' : '#1c3934';
    rightArrow.style.background = rightArrow.disabled ? '#ccc' : '#1c3934';
  }

  // Gestion du clic Gauche
  leftArrow.addEventListener("click", () => {
    const { stepWidth } = getSlideMetrics();
    currentPosition -= stepWidth;
    if (currentPosition < 0) currentPosition = 0;
    categories.style.transform = `translateX(-${currentPosition}px)`;
    updateArrows();
  });

  // Gestion du clic Droit
  rightArrow.addEventListener("click", () => {
    const { stepWidth, maxPosition } = getSlideMetrics();
    currentPosition += stepWidth;
    if (currentPosition > maxPosition) currentPosition = maxPosition;
    categories.style.transform = `translateX(-${currentPosition}px)`;
    updateArrows();
  });
  
  // Événement de redimensionnement pour recalculer les métriques
  window.addEventListener('resize', () => {
    updateArrows(); 
  });

  // Initialisation
  updateArrows();
});


// ACHETER PAR FORME


    // Amélioration des animations - uniquement pour cette section
    document.addEventListener('DOMContentLoaded', function() {
        const shapeImages = document.querySelectorAll('.custom-shape-image');
        
        shapeImages.forEach(container => {
            container.addEventListener('mouseenter', function() {
                this.style.background = 'linear-gradient(145deg, #ffffff, #f1f3f4)';
            });
            
            container.addEventListener('mouseleave', function() {
                this.style.background = '#f8fdfc';
            });
        });
    });


    // Gestion du toggle des menus sur mobile
document.querySelectorAll('.footer-col h3').forEach(title => {
  title.addEventListener('click', function() {
    if (window.innerWidth <= 767) {
      this.parentElement.classList.toggle('active');
    }
  });
});


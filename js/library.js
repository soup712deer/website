window.addEventListener('DOMContentLoaded', () => {

    const pctEl = document.getElementById('loader-pct');
    const loaderEl = document.getElementById('loader');
    const timeEl = document.getElementById('loader-time');

    function updateTime(){

        const now = new Date();

        let hour = now.getHours();
        let minute = now.getMinutes();
        let second = now.getSeconds();

        hour = String(hour).padStart(2,'0');
        minute = String(minute).padStart(2,'0');
        second = String(second).padStart(2,'0');

        timeEl.textContent = `Loading...`;
    }

    updateTime();

    
    setInterval(updateTime,1000);

    let pct = 0;

    const interval = setInterval(() => {

        pct += Math.random() * 12 + 4;

        if (pct >= 100) {

            pct = 100;

            clearInterval(interval);

            setTimeout(() => {

                loaderEl.classList.add('hide');

                setTimeout(() => {
                    loaderEl.style.display = 'none';
                }, 800);

            }, 300);
        }

        pctEl.textContent = Math.floor(pct) + '%';

    }, 80);

});

const cursor = document.getElementById('cursor');
let cursorX = window.innerWidth / 2;
let cursorY = window.innerHeight / 2;
let targetX = cursorX;
let targetY = cursorY;
const ease = 0.18;

const updateCursor = () => {
    cursorX += (targetX - cursorX) * ease;
    cursorY += (targetY - cursorY) * ease;
    cursor.style.transform = `translate(${cursorX}px, ${cursorY}px)`;
    requestAnimationFrame(updateCursor);
};

document.addEventListener('mousemove', (e) => {
    targetX = e.clientX;
    targetY = e.clientY;
});

updateCursor();


const linkElem = document.querySelectorAll('a:not(.no_stick_)');

linkElem.forEach(link => {

    link.addEventListener('mouseenter', () => {
        cursor.classList.add('is_active');
    });

    link.addEventListener('mouseleave', () => {
        cursor.classList.remove('is_active');
    });

});

/* スライドショー */
const slideshowSlides = document.querySelectorAll('.slideshow-slide li');

if (slideshowSlides.length > 0) {
  slideshowSlides.forEach(slide => {
    slide.style.position = 'absolute';
    slide.style.opacity = '0';
    slide.style.transition = 'opacity 0.5s ease-in-out';
  });

  let currentIndex = 0;

  const showSlide = (index) => {
    slideshowSlides.forEach((slide, i) => {
      slide.style.opacity = i === index ? '1' : '0';
      slide.style.pointerEvents = i === index ? 'auto' : 'none';
    });
  };

  showSlide(0);

  setInterval(() => {
    currentIndex = (currentIndex + 1) % slideshowSlides.length;
    showSlide(currentIndex);
  }, 3000);
}


window.addEventListener('load', function initHoloBg() {
  const canvas = document.getElementById('holo-bg');
  if (!canvas || typeof THREE === 'undefined') return;

  const vertSrc = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position.xy, 0.0, 1.0);
    }
  `;

  const fragSrc = `
    precision mediump float;
    varying vec2 vUv;
    uniform float uTime;
    uniform vec2 uResolution;
    uniform vec3 uColor1;
    uniform vec3 uColor2;
    uniform vec3 uColor3;
    uniform float uScaleX;
    uniform float uScaleY;

    float map(float v, float a, float b, float c, float d) {
      return c + (v - a) * (d - c) / (b - a);
    }
    float noise(vec2 p) { return cos(p.x) * sin(p.y); }
    float fbm(vec2 st) {
      float v = 0.0, a = 0.5;
      for (int i = 0; i < 5; i++) {
        v += a * noise(st);
        st *= 2.0;
        a *= 0.5;
      }
      return v;
    }

    void main() {
      float aspect = uResolution.x / uResolution.y;
      vec2 norm = vec2(min(aspect, 1.0), min(1.0 / aspect, 1.0));
      vec2 st = (vUv - 0.5) * norm + 0.5;
      st += vec2(0.1, 2.0);
      st *= vec2(uScaleX, uScaleY);

      vec3 color = uColor1;
      vec2 f1 = vec2(fbm(st + vec2(0.2)), fbm(st + vec2(0.1)));
      vec2 f2 = vec2(
        fbm(st + 6.0 * f1 + 0.1 * uTime),
        fbm(st + 6.0 * f1 + 0.12 * uTime)
      );
      color = mix(color, uColor2, clamp(length(f1), 0.0, 1.0));
      color = mix(color, uColor3, clamp(length(f2), 0.0, 1.0));

      float f3 = fbm(st + 8.0 * f2);
      f3 = pow(f3, 4.0) + pow(f3, 3.0) + pow(f3, 2.0);
      f3 = map(f3, 0.0, 1.0, 0.7, 1.0);
      color *= f3;
      vec3 met = vec3(pow(f3, 3.0) + pow(f3, 3.0)) * 1.2;
      color = mix(color, met, 0.7);
      color *= color * 1.7;

      gl_FragColor = vec4(color, 1.0);
    }
  `;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: false, antialias: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
  camera.position.z = 1;

  const uniforms = {
    uTime:       { value: 0 },
    uResolution: { value: new THREE.Vector2() },
    uColor1:     { value: new THREE.Color('#ff00ff') },
    uColor2:     { value: new THREE.Color('#0000ff') },
    uColor3:     { value: new THREE.Color('#00ffff') },
    uScaleX:     { value: 2.8 },
    uScaleY:     { value: 1.5 },
  };

  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.ShaderMaterial({
      uniforms,
      vertexShader: vertSrc,
      fragmentShader: fragSrc,
      depthTest: false,
      depthWrite: false,
    })
  );
  scene.add(mesh);

  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h, false);
    uniforms.uResolution.value.set(canvas.width, canvas.height);
  }
  window.addEventListener('resize', resize);
  resize();

  function tick(t) {
    uniforms.uTime.value = t * 0.001;
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
});

const GLITCH_CHARS = '!<>-_\\/[]{}—=+*^?#|~ABCDEFabcdef01234';
const typingText = document.querySelector('.hobby-title');
const text = 'Library'; 

let index = 1;
let glitchIntervalId = null;


setTimeout(typeText, 1000);


function typeText() {
  const currentTargetText = text.slice(0, index);
  
  const randomInterval = Math.floor(Math.random() * 350) + 50;

  startGlitchEffect(currentTargetText, () => {
    if (index < text.length) {
      index++;
      setTimeout(typeText, randomInterval);
    } else {
      setTimeout(eraseText, 1500);
    }
  });
}


function startGlitchEffect(targetText, onComplete) {
  if (glitchIntervalId) clearInterval(glitchIntervalId);

  let scrambleCount = 0;
  const maxScramble = 6; 
  glitchIntervalId = setInterval(() => {
    if (scrambleCount < maxScramble) {
      const baseText = targetText.slice(0, -1);
      const randomChar = GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
      
      typingText.textContent = targetText.length > 1 ? baseText + randomChar : randomChar;
      scrambleCount++;
    } else {
      clearInterval(glitchIntervalId);
      typingText.textContent = targetText;
      onComplete(); 
    }
  }, 10); 
}

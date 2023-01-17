import './css/styles.css';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';
import Notiflix from 'notiflix';
import { axiosGet } from './axiosAPI';

const formEl = document.querySelector('#search-form');
const galleryEl = document.querySelector('.gallery');
const buttonLoadMore = document.querySelector('.load-more');
const guard = document.querySelector('.guard');

formEl.addEventListener('submit', onSearch);
buttonLoadMore.addEventListener('click', onLoadMore);

// Бібліотека перегляду картинок в модальному вікні
let gallery = new SimpleLightbox('.gallery a');
gallery.on('show.simplelightbox');

//Безкінечний скрол
const observerOption = {
  root: null,
  rootMargin: '300px',
  threshold: 1.0,
};
const observer = new IntersectionObserver(onInfinityLoad, observerOption);

// Останнє значення пошуку (актуалізується після натискання кнопки пошуку)
let searchValue;
//Поточна сторінка
let currentPage = 1;
// Кількість елементів на сторінці
const countImgoOnPage = 100;
// Режим нескінченного скролу. Якщо modeInfinityScroll - false, То робота по кнопці.
let modeInfinityScroll = true;
modeYesNoScrollOrButton();

//ФУНКЦІЯ. Пошук зображень по ключовому
function onSearch(evt) {
  evt.preventDefault();

  //Після нового пошуку починаємо нумерацію сторінки з 1
  currentPage = 1;
  galleryEl.innerHTML = '';
  hiddenBtnLoadMore(true);
  // Запам'ятати останнє значення пошуку (щоб при натиснкнні на кнопку "load more" пошук продовжував виконуватись по цьому імені)
  searchValue = evt.currentTarget.elements.searchQuery.value;
  if (!searchValue) {
    Notiflix.Notify.info('Please, enter your search text');
    return;
  }
  // Завантажити галерею зображень
  loadGallery();
}

// ФУНКЦІЯ. Завантажити галерею
async function loadGallery() {
  //Змінна з результатом від бекенду(оголошуємо до try, щоб був доступ до даної змінної після "try...catch")
  let response;
  // Якщо isLoadMore === true, тоді натиснута кнопка "loadMore", в іншому випадку  -натиснули кнопку "пошуку"
  let isLoadMore = currentPage != 1;
  try {
    //Запит на бекенд
    response = await axiosGet({
      searchValue,
      page: currentPage,
      countImgoOnPage,
    });
  } catch (err) {
    Notiflix.Notify.failure('1' + err.request.responseText);
    return;
  }

  let data = response.data;

  // Видати повідомлення, якщо масив прийшов від бекенда пустий
  if (data.totalHits === 0) {
    Notiflix.Notify.warning(
      'Sorry, there are no images matching your search query. Please try again.'
    );
    return;
  }

  //При натисканні на кнопку пошук виводити повідомлення кількості знайднених зображень (тільки коли сторінка у нас перша)
  if (!isLoadMore) {
    Notiflix.Notify.success(`Hooray! We found ${data.totalHits} images.`);
  }

  //Створює розмітку галереї
  createMarkupGallery(data.hits);

  if (modeInfinityScroll) {
    observer.observe(guard);
  }

  // Якщо тиснули кнопку loadMore, то виконати плавний скрол
  if (isLoadMore) {
    scrollAfterLoadMore();
  }

  //Якщо сторінка остання приховати кнопку "loadMore"
  let isEndPage = Math.ceil(data.totalHits / countImgoOnPage) === currentPage;
  hiddenBtnLoadMore(isEndPage || modeInfinityScroll);

  if (isEndPage && modeInfinityScroll) {
    observer.unobserve(guard);
  }
  //Виводити повідомлення, якщо ми завантажили останню сторінку і була натиснута кнопка loadMore
  if (isEndPage && isLoadMore) {
    Notiflix.Notify.info(
      "We're sorry, but you've reached the end of search results."
    );
  }
}

//ФУНКЦІЯ. Завантажити наступну сторінку при натисканні на кнопку loadMore
function onLoadMore() {
  currentPage += 1;
  loadGallery();
}

// ФУНКЦІЯ. Створення розмітки карток галереї
function createMarkupGallery(arrayHits) {
  const markup = arrayHits
    .map(
      ({
        webformatURL,
        largeImageURL,
        tags,
        likes,
        views,
        comments,
        downloads,
      }) => `
  <div class="photo-card">
      <a href="${largeImageURL}">
      <img class="photo-img" src="${webformatURL}" alt="${tags}" loading="lazy" /> </a>
    <div class="info">
      <p class="info-item">
        <b>Likes ${likes}</b>
      </p>
      <p class="info-item">
        <b>Views ${views}</b>
      </p>
      <p class="info-item">
        <b>Comments ${comments}</b>
      </p>
      <p class="info-item">
        <b>Downloads ${downloads}</b>
      </p>
    </div>
 </div> `
    )
    .join('');

  galleryEl.insertAdjacentHTML('beforeend', markup);
  gallery.refresh();
}

//ФУНКЦІЯ. Управляє видимістю кнопки "loadMore"
function hiddenBtnLoadMore(hidden) {
  if (hidden) {
    buttonLoadMore.classList.add('visually-hidden');
  } else {
    buttonLoadMore.classList.remove('visually-hidden');
  }
}

//ФУНКЦІЯ. Плавний скрол після наскання кнопки "завантажити ще"
function scrollAfterLoadMore() {
  const { height: cardHeight } = document
    .querySelector('.gallery')
    .firstElementChild.getBoundingClientRect();

  window.scrollBy({
    top: cardHeight * 2,
    behavior: 'smooth',
  });
}

// ФУНКЦІЯ. Дозавантажити галерею при прокручуванню скрола
function onInfinityLoad(entries, observer) {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      onLoadMore();
    }
  });
}

// ФУНКЦІЯ. Вибір режиму роботи
function modeYesNoScrollOrButton() {
  Notiflix.Confirm.show(
    'Mode Infinity Scroll',
    'Enable mode?',
    'Yes - mode Infinity',
    'No - mode Button',
    function okCb() {
      modeInfinityScroll = true;
      return true;
    },
    function cancelCb() {
      modeInfinityScroll = false;
      return false;
    },
    {
      width: '320px',
      borderRadius: '8px',
    }
  );
}

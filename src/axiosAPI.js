import axios from 'axios';

const BASE_URL = 'https://pixabay.com/api';
const KEY = '32876587-b0e3dd5d308a258610a0fd70a';

export function axiosGet(param) {
  return axios.get(
    `${BASE_URL}/?key=${KEY}&q=${param.searchValue}&image_type=photo&orientation=horizontal&safesearch=true&page=${param.page}&per_page=${param.countImgoOnPage}`
  );
}

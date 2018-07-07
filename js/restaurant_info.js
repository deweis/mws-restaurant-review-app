/* jshint esversion: 6 */
let restaurant;
var map;

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false,
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
};

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant);
    return;
  }

  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL';
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }

      fillRestaurantHTML();
      callback(null, restaurant);
    });
  }
};

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img';
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.alt = `Picture related to the ${restaurant.name} restaurant`;

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }

  // fill reviews
  fillReviewsHTML();
};

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  hours.innerHTML = ''; // mitigate double appending
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
};

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (restaurantId = self.restaurant.id) => {
  DBHelper.fetchReviews(restaurantId, (error, reviews) => {

    if (error) {
      console.log(error);
    } else {
      const container = document.getElementById('reviews-container');
      container.innerHTML = '<ul id="reviews-list"></ul>'; // mitigate double appending

      const reviewsTitleBar = document.createElement('div');
      reviewsTitleBar.setAttribute('class', 'reviews-title-container');
      reviewsTitleBar.innerHTML = `
        <h3 class="reviews-title">Reviews</h3>
        <button id="btn-add-review" class="btn-add-review" type="button">Add Review</button>
      `;
      container.appendChild(reviewsTitleBar);

      document.getElementById('btn-add-review').addEventListener('click', function () {
        //document.getElementById('reviewForm').style.display = 'list-item';
        console.log('add review form');
        addReviewForm();
      });

      if (!reviews) {
        const noReviews = document.createElement('p');
        noReviews.innerHTML = 'No reviews yet!';
        container.appendChild(noReviews);
        return;
      } else {
        const ul = document.getElementById('reviews-list');
        reviews.forEach(review => {
          ul.appendChild(createReviewHTML(review));
        });
        container.appendChild(ul);
      }
    }
  });
};

addReview = () => {
  const review = {
    id: '',
    restaurant_id: self.restaurant.id,
    name: document.getElementById('nameInput').value,
    createdAt: new Date().getTime(),
    updatedAt: new Date().getTime(),
    rating: +document.getElementById('ratingSelect').value,
    comments: document.getElementById('commentInput').value,
  };

  console.log(review);
  const ul = document.getElementById('reviews-list');
  ul.insertBefore(createReviewHTML(review), ul.childNodes[0]);

  document.getElementById('reviewForm').style.display = 'none';
  document.getElementById('btn-add-review').style.display = 'inline-block';
};

/**
 * Create review form and add it as first list item
 */
addReviewForm = () => {
  const li = document.createElement('li');
  li.setAttribute('class', 'reviewForm');
  li.setAttribute('id', 'reviewForm');

  const form = document.createElement('form');
  form.setAttribute = ('id', 'reviewForm');
  li.appendChild(form);

  const div = document.createElement('div');
  div.setAttribute('class', 'review-header reviewHeaderInput');
  form.appendChild(div);

  const nameInput = document.createElement('input');
  nameInput.setAttribute('type', 'text');
  nameInput.setAttribute('placeholder', 'Your name');
  nameInput.setAttribute('id', 'nameInput');
  nameInput.setAttribute('class', 'nameInput');
  div.appendChild(nameInput);

  const date = document.createElement('p');
  date.setAttribute('class', 'reviewDate dateInput');
  const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  date.innerHTML = (new Date()).toLocaleDateString('en-US', dateOptions);
  div.appendChild(date);

  const ratingInput = document.createElement('div');
  ratingInput.setAttribute('class', 'ratingInput');
  form.appendChild(ratingInput);

  const ratingLabel = document.createElement('label');
  ratingLabel.innerHTML = 'Your rating:';
  ratingLabel.setAttribute('for', 'ratingInput');
  ratingInput.appendChild(ratingLabel);

  const ratingSelect = document.createElement('select');
  ratingSelect.innerHTML = `
    <option>5</option>
    <option>4</option>
    <option>3</option>
    <option>2</option>
    <option>1</option>
  `;
  ratingSelect.setAttribute('class', 'ratingSelect');
  ratingSelect.setAttribute('id', 'ratingSelect');
  ratingInput.appendChild(ratingSelect);

  const commentInput = document.createElement('textarea');
  commentInput.setAttribute('placeholder', 'Comment your rating..');
  commentInput.setAttribute('class', 'commentInput');
  commentInput.setAttribute('id', 'commentInput');
  commentInput.setAttribute('rows', '5');
  form.appendChild(commentInput);

  const submitBtn = document.createElement('button');
  submitBtn.setAttribute('type', 'submit');
  submitBtn.innerHTML = 'Submit';
  submitBtn.setAttribute('class', 'btn-submit-review');
  form.appendChild(submitBtn);

  const ul = document.getElementById('reviews-list');
  ul.insertBefore(li, ul.childNodes[0]);
  document.getElementById('nameInput').required = true;
  document.getElementById('nameInput').autofocus = true;
  document.getElementById('commentInput').required = true;

  document.getElementById('reviewForm').addEventListener('submit', function (event) {
    event.preventDefault();   // Thank you https://stackoverflow.com/questions/21338476/addeventlistener-on-form-submit
    addReview();
  });

  document.getElementById('btn-add-review').style.display = 'none';
};

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  const div = document.createElement('div');
  div.setAttribute('class', 'review-header');
  li.appendChild(div);

  const name = document.createElement('p');
  name.setAttribute('class', 'reviewName');
  name.innerHTML = review.name;
  div.appendChild(name);

  const date = document.createElement('p');
  date.setAttribute('class', 'reviewDate');
  const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  date.innerHTML = (new Date(review.createdAt)).toLocaleDateString('en-US', dateOptions);
  div.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  rating.setAttribute('class', 'reviewRating');
  rating.style.backgroundColor = review.rating === 5 ? 'green' :
                                 review.rating > 2 ? 'orange' : 'red';
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  comments.setAttribute('class', 'reviewComment');
  li.appendChild(comments);

  return li;
};

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  if (breadcrumb.childElementCount === 2) return; // mitigate double appending
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
};

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`);
  const results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
};

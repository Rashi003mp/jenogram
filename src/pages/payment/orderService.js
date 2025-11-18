// // src/services/orderService.js
// import axios from 'axios';
// import { URL } from '../api'; // your base URL

// /**
//  * createOrder
//  * - dto: CreateOrderDTO (AddressId, NewAddress, PaymentMethod, ...)
//  * - options: { buyNow: { productId, quantity } } OR null
//  * - token: auth token
//  *
//  * returns Axios response.data (your ApiResponse shape)
//  */
// export async function createOrder(dto, token, options = {}) {
//   const { buyNow } = options;
//   const query = buyNow && buyNow.productId && buyNow.quantity
//     ? `?productId=${encodeURIComponent(buyNow.productId)}&quantity=${encodeURIComponent(buyNow.quantity)}`
//     : '';
//   const url = `${URL}/order/create${query}`;

//   const res = await axios.post(url, dto, {
//     headers: {
//       Authorization: `Bearer ${token}`,
//       'Content-Type': 'application/json'
//     }
//   });

//   return res.data;
// }

// /**
//  * optionally export other order APIs
//  */
// export async function getOrder(orderId, token) {
//   const url = `${URL}/order/${orderId}`;
//   const res = await axios.get(url, {
//     headers: { Authorization: `Bearer ${token}` }
//   });
//   return res.data;
// }

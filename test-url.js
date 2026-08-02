// Test URL construction
const { URL } = require('url');

// Original (broken) approach
const baseUrl1 = 'https://generativelanguage.googleapis.com/v1beta/openai';
const url1 = new URL('/models', baseUrl1);
console.log('Original (broken):', url1.href);

// My fix approach
const baseUrl2 = 'https://generativelanguage.googleapis.com/v1beta/openai/';
const url2 = new URL('models', baseUrl2);
console.log('My fix:', url2.href);

// What happens with the replace logic
const baseUrl3 = ('https://generativelanguage.googleapis.com/v1beta/openai').replace(/\/+$/, '') + '/';
const url3 = new URL('models', baseUrl3);
console.log('With replace logic:', url3.href);

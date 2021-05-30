require('dotenv').config();

//이 파일에서만 no-global-assign ESLint 옵션을 비활성화합니다.
// eslint-disable no-global-assign
require = require('esm')(module /*, options*/);
module.exports = require('./main.js');


import Koa from 'koa'; //Koa 를 사용하겠다.
import Router from 'koa-router'; //koa는 라우터를 기본으로 제공하지 않기 때문에 따로 깔아서 사용해야 한다.
import bodyParser from 'koa-bodyparser'; //파라미터 값이 들어오는 것을 파싱하여 사용할 수 있다.
import mongoose from 'mongoose'; //몽고 디비를 사용한다.

//비구조화 할당을 통해 process.env 내부 값에 대한 레퍼런스 만들기
const {PORT, MONGO_URI} = process.env; 

//몽고디비 연결
mongoose
.connect(MONGO_URI, {useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: false})
.then(()=>{
    console.log('Connected to MongoDB');
    
})
.catch(e=>{
    console.error(e);
});


import api from './api'
import jwtMiddleware from './lib/jwtMiddleware';

//Koa를 app이라는 이름으로 사용하겠다.
const app = new Koa();
const router = new Router();


//라우터 설정
router.use('/api', api.routes());



//라우터 적용 전에 bodyParser 적용
app.use(bodyParser());
//라우터 적용 전에 Middleware 적용
app.use(jwtMiddleware);

//app 인스턴스에 라우터 적용
app.use(router.routes()).use(router.allowedMethods());


//PORT가 지정되어 있지 않다면 4000을 사용
const port = PORT || 4000;

//koa의 서버 포트를 4000번을 사용하겠다. 
app.listen(4000, ()=>{
    console.log('Listening to port %d', port);
})
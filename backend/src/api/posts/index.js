import Router from 'koa-router';
import * as postsCtrl from './posts.ctrl';
import checkLoggedIn from '../../lib/checkLoggedIn';
import multer from '@koa/multer';

const posts = new Router();

const upload = multer({ 
    dest: __dirname+'/uploads/', // 이미지 업로드 경로
})


posts.get('/', postsCtrl.list);
posts.post('/',checkLoggedIn, postsCtrl.write);
posts.post('/draw',upload.single('file'), postsCtrl.storage);

const post = new Router();
post.get('/', postsCtrl.read);
post.delete('/' ,checkLoggedIn, postsCtrl.checkOwnPost, postsCtrl.remove);
post.patch('/',checkLoggedIn, postsCtrl.checkOwnPost , postsCtrl.update);

posts.use('/:id', postsCtrl.getPostById, post.routes());

export default posts;
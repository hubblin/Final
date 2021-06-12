import Post from '../../models/post';
import mongoose from 'mongoose';
import Joi from '@hapi/joi';

const {ObjectId} = mongoose.Types;




export const storage = async(ctx, next) =>{
    const { fieldname, originalname, encoding, mimetype, destination, filename, path, size } = ctx.request.file
    const { name } = ctx.request.body;


    ctx.body = {ok: true, data: "Single Upload Ok"}
    
}

//중복이 발생할 수 있는 부분은 미들웨어로 따로 만들어서 동작하게 할 수 있다.
export const getPostById = async(ctx, next) =>{
    const {id} =ctx.params;
    if(!ObjectId.isValid(id)){
        ctx.status = 400;
        return;
    }
    try{
        const post = await Post.findById(id);

        //포스트가 존재하지 않을 때
        if(!post){
            ctx.status = 404; // Not Found
            return;
        }
        ctx.state.post = post;
        return next();
    }catch(e){
        ctx.throw(500, e)
    }
    return next();
}

/**포스트 작성
 * POST /api/posts
 * {title, body}
 */
export const write = async ctx =>{
    const schema = Joi.object().keys({
        title: Joi.string().required(),
        body: Joi.string().required(),
        tags: Joi.array().items(Joi.string()).required()
    })

    //검증하고 검증이 실패인 경우 에러
    const result = schema.validate(ctx.request.body);
    if(result.error){
        ctx.status = 400 // Basd Resquest
        ctx.body = result.error;
        return;
    }
    const {title,body, tags} = ctx.request.body;
    
    const post = new Post({
        title,
        body,
        tags,
        user: ctx.state.user,
    });
    try{
        await post.save();
        ctx.body = post;
    }catch(e){
        ctx.throw(500, e);
    }
};

/**
 * 포스트 목록 조회
 * GET /api/posts
 */
export const list = async ctx =>{

    const page = parseInt(ctx.query.page || '1', 10);

    if(page < 1){
        ctx.status = 400;
        return;
    }

    const {tag, username} = ctx.query;
    // tag, username 값이 유효하면 객체 안에 넣고, 그렇지 않으면 넣지 않음
    
    if(!tag){

    }else{
        var parsedTag = tag.split(',');
    }
    
    const query = {
        ...(username ? {'user.username' : username}: {}),
        ...(tag ? {tags: {$all : parsedTag}}: {}),
    }



    try{
        
        const posts = await Post.find(query).sort({_id: -1}).limit(36).skip((page -1) * 36).lean().exec(); //역순으로 10개의 제한을 둔다. lean을 이용하면 처음부터 데이터를 json으로 가지고 온다.
        
        const postCount = await Post.countDocuments(query).exec();
        
        ctx.set('Last-Page', Math.ceil(postCount / 36));
        
        ctx.body = posts.map(post => ({...post, title:
            post.title.length < 7 ? post.title : `${post.title.slice(0,7)}...`,
        }));
    }catch(e) {
        ctx.throw(500, e)
    }
};


/**
 * 특정 포스트 조회
 * GET /api/posts/:id
 */
export const read = ctx =>{
    ctx.body = ctx.state.post;
};

/**
 * 특정 포스트 제거
 * DELETE /api/posts/:id
 */
export const remove = async ctx =>{
    const {id} = ctx.params;
    try{
        await Post.findByIdAndRemove(id).exec();
        ctx.status = 204;
    }catch(e){
        ctx.throw(500, e);
    }
};

/**
 * 포스트 수정(교체)
 * PUT /api/posts/:id
 * {title, body}
 */
export const update = async ctx =>{
    const {id} = ctx.params;

    const schema = Joi.object().keys({
        title: Joi.string(),
        body: Joi.string(),
        tags: Joi.array().items(Joi.string())
    });

    const result = schema.validate(ctx.request.body);
    if(result.error){
        ctx.status = 400;
        ctx.body = result.error;
        return;
    }

    try{
        const post = await Post.findByIdAndUpdate(id, ctx.request.body, {
            new : true,
        }).exec();
        if(!post){
            ctx.status = 404;
            return;
        }
        ctx.body = post;
    }catch(e){
        ctx.throw(500, e);
    }
};

/**
 * 포스트 수정(특정 필드 변경)
 * PATCH /api/posts/:id
 * {title, body}
 */
export const checkOwnPost = (ctx, next) =>{
    const {user, post} = ctx.state;
    if(post.user._id.toString() !== user._id){
        ctx.status = 403;
        return;
    }
    return next();
}
import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import {
  IArticle,
  IComment,
  INewArticle,
  INewComment,
  IUpdateArticle,
} from '@realworld/article/api-interfaces';
import {
  Article,
  ArticleService,
  Comment,
  CommentService,
  Favorite,
  FavoriteService,
  TagService,
} from '@realworld/article/api/shared';
import {
  CREATED_MSG,
  DELETED_MSG,
  NOT_FOUND_MSG,
  UPDATED_MSG,
} from '@realworld/shared/api/constants';
import { mapQueriesToFindManyOptions } from '@realworld/shared/api/foundation';
import {
  ActionSuccessResponse,
  DetailSuccessResponse,
  IResponse,
  ListSuccessResponse,
} from '@realworld/shared/client-server';
import { StringUtil } from '@realworld/shared/string-util';
import {
  Follow,
  FollowService,
  SkipAuth,
  UserService,
} from '@realworld/user/api/shared';
import { In, Like } from 'typeorm';

@Controller()
export class ArticleApiHandlersController {
  constructor(
    private articleService: ArticleService,
    private userService: UserService,
    private favoriteService: FavoriteService,
    private followService: FollowService,
    private tagService: TagService,
    private commentService: CommentService
  ) {}

  // Article apis

  @Post('articles')
  async create(
    @Req() req,
    @Body() data: Partial<INewArticle>
  ): Promise<IResponse<IArticle>> {
    const article: Partial<Article> = {
      ...data,
      authorId: req?.user?.sub,
      slug: StringUtil.asciiSlug(data.title) + '-' + new Date().getTime(),
    };
    await this.articleService.insert(article);

    if (data.tagList) {
      this.updateTags(data.tagList);
    }

    return new ActionSuccessResponse<IArticle>({
      message: CREATED_MSG,
      data: await this.mapToResponseArticle(
        article?.authorId,
        article as Article
      ),
    });
  }

  @Put('articles/:slug')
  async update(
    @Req() req,
    @Param('slug') slug,
    @Body() data: Partial<IUpdateArticle>
  ): Promise<IResponse<IArticle>> {
    const existingArticle = await this.articleService.findOne({ slug: slug });
    if (!existingArticle) {
      throw new NotFoundException(NOT_FOUND_MSG);
    }

    if (existingArticle.authorId !== req?.user?.sub) {
      throw new UnauthorizedException();
    }

    const { title, description, body } = data;
    let article: Partial<Article> = {};
    if (title) {
      article.title = title;
    }
    if (description) {
      article.description = description;
    }
    if (body) {
      article.body = body;
    }

    await this.articleService.update({ slug: slug }, article);
    article = await this.articleService.findOne({ slug: slug });
    return new ActionSuccessResponse<IArticle>({
      message: UPDATED_MSG,
      data: await this.mapToResponseArticle(req?.user?.sub, article as Article),
    });
  }

  @Delete('articles/:slug')
  async delete(
    @Req() req,
    @Param('slug') slug: string
  ): Promise<IResponse<null>> {
    const article = await this.articleService.findOne({ slug: slug });
    if (!article) {
      throw new NotFoundException(NOT_FOUND_MSG);
    }

    if (article.authorId !== req?.user?.sub) {
      throw new UnauthorizedException();
    }

    await this.articleService.softDelete({ slug: slug });

    return new ActionSuccessResponse({
      message: DELETED_MSG,
      data: null,
    });
  }

  @Get('articles/feed')
  async findAllFeed(@Req() req, @Query() query): Promise<IResponse<IArticle>> {
    const follows = await this.followService.findAll(
      mapQueriesToFindManyOptions<Follow>({ followerId: req?.user?.sub })
    );
    const followedIds = follows.map((f) => f.followedId);

    const options = mapQueriesToFindManyOptions<Article>({
      ...query,
      authorId: In(followedIds),
    });
    const res = await this.articleService.findAll(options);

    return new ListSuccessResponse<IArticle>({
      listData: await Promise.all(
        res.map((a) => this.mapToResponseArticle(req?.user?.sub, a))
      ),
      total: await this.articleService.count(options),
    });
  }

  @SkipAuth()
  @Get('articles/:slug')
  async findBySlug(
    @Req() req,
    @Param('slug') slug: string
  ): Promise<IResponse<IArticle>> {
    const article = await this.articleService.findOne({ slug: slug });
    if (!article) {
      throw new NotFoundException(NOT_FOUND_MSG);
    }

    const jwtInfo = this.userService.getJwtInfo(req);

    return new DetailSuccessResponse<IArticle>({
      detailData: await this.mapToResponseArticle(jwtInfo?.sub, article),
    });
  }

  @SkipAuth()
  @Get('articles')
  async findAll(@Req() req, @Query() query): Promise<IResponse<IArticle>> {
    const { tag, author, favorited } = query;
    delete query.author;
    delete query.tag;
    delete query.favorited;

    const jwtInfo = this.userService.getJwtInfo(req);

    if (author) {
      const user = await this.userService.findOne({ username: author });
      if (user) {
        query.authorId = user.id;
      }
    }
    if (tag) {
      const escapedTag = tag.replace(/%/g, '\\%').replace(/_/g, '\\_');
      query.tagList = Like(`%${escapedTag}%`);
    }

    const options = mapQueriesToFindManyOptions<Article>(
      query,
      'title',
      'slug',
      'shortDescription',
      'body'
    );

    if (favorited) {
      const user = await this.userService.findOne({ username: favorited });
      if (user) {
        const [
          res,
          count,
        ] = await this.articleService.repository
          .createQueryBuilder('article')
          .innerJoinAndSelect(
            'favorite',
            'favorite',
            'article.slug = favorite.articleSlug'
          )
          .where(options?.where)
          .andWhere('favorite.userid = :userId', { userId: user.id })
          .take(options?.take)
          .skip(options?.skip)
          .orderBy('favorite.createdAt', 'DESC')
          .getManyAndCount();

        return new ListSuccessResponse<IArticle>({
          listData: await Promise.all(
            res.map((a) => this.mapToResponseArticle(jwtInfo?.sub, a))
          ),
          total: count,
        });
      }
    }

    const res = await this.articleService.findAll(options);
    return new ListSuccessResponse<IArticle>({
      listData: await Promise.all(
        res.map((a) => this.mapToResponseArticle(jwtInfo?.sub, a))
      ),
      total: await this.articleService.count(options),
    });
  }

  // Favorite apis

  @Post('articles/:slug/favorite')
  async favoriteAnArticle(
    @Req() req,
    @Param('slug') slug
  ): Promise<IResponse<IArticle>> {
    const isFavorited = !!(await this.favoriteService.findOne({
      userId: req?.user?.sub,
      articleSlug: slug,
    }));
    if (!isFavorited) {
      await this.favoriteService.insert({
        userId: req?.user?.sub,
        articleSlug: slug,
      });
    }
    const article = await this.articleService.findOne({ slug: slug });
    return new ActionSuccessResponse<IArticle>({
      message: '',
      data: await this.mapToResponseArticle(req?.user?.sub, article as Article),
    });
  }

  @Delete('articles/:slug/favorite')
  async unfavoriteAnArticle(
    @Req() req,
    @Param('slug') slug
  ): Promise<IResponse<IArticle>> {
    const isFavorited = !!(await this.favoriteService.findOne({
      userId: req?.user?.sub,
      articleSlug: slug,
    }));
    if (isFavorited) {
      await this.favoriteService.softDelete({
        userId: req?.user?.sub,
        articleSlug: slug,
      });
    }
    const article = await this.articleService.findOne({ slug: slug });
    return new ActionSuccessResponse<IArticle>({
      message: '',
      data: await this.mapToResponseArticle(req?.user?.sub, article as Article),
    });
  }

  // Comment apis

  @SkipAuth()
  @Get('articles/:slug/comments')
  async findAllComments(
    @Req() req,
    @Param('slug') slug: string
  ): Promise<IResponse<IComment>> {
    const options = mapQueriesToFindManyOptions<Comment>({ articleSlug: slug });
    const res = await this.commentService.findAll(options);

    const jwtInfo = this.userService.getJwtInfo(req);
    return new ListSuccessResponse<IComment>({
      listData: await Promise.all(
        res.map((c) => this.mapToResponseComment(jwtInfo?.sub, c))
      ),
      total: await this.commentService.count(options),
    });
  }

  @Post('articles/:slug/comments')
  async createAComment(
    @Req() req,
    @Param('slug') slug: string,
    @Body() data: INewComment
  ): Promise<IResponse<IComment>> {
    const comment: Partial<Comment> = {
      ...data,
      authorId: req?.user?.sub,
      articleSlug: slug,
    };
    await this.commentService.insert(comment);

    return new ActionSuccessResponse<IComment>({
      message: '',
      data: await this.mapToResponseComment(
        comment?.authorId,
        comment as Comment
      ),
    });
  }

  @Delete('articles/:slug/comments/:id')
  async deleteAComment(
    @Req() req,
    @Param('slug') slug: string,
    @Param('id') id: string
  ): Promise<IResponse<null>> {
    const comment = await this.commentService.findOne({
      id: id,
      articleSlug: slug,
    });
    if (!comment) {
      throw new NotFoundException();
    }

    if (comment.authorId !== req?.user?.sub) {
      throw new UnauthorizedException();
    }

    await this.commentService.softDelete({ articleSlug: slug, id: id });
    return new ActionSuccessResponse({
      message: DELETED_MSG,
      data: null,
    });
  }

  // Tag apis

  @SkipAuth()
  @Get('tags')
  async findAllTags(@Query() query): Promise<IResponse<string>> {
    const options = mapQueriesToFindManyOptions(query);
    const tags = await this.tagService.findAll(options);

    return new ListSuccessResponse<string>({
      listData: tags.map((t) => t.name),
      total: await this.tagService.count(),
    });
  }

  // Helper functions

  private async updateTags(tagList: string[]) {
    for (let t of tagList) {
      t = t.trim();
      const tag = await this.tagService.findOne({ name: t });
      if (!tag) {
        await this.tagService.insert({ name: t, count: 1 });
      } else {
        await this.tagService.update({ id: tag.id }, { count: ++tag.count });
      }
    }
  }

  private async didUserFavoriteThisArticle(
    userId: string,
    slug: string
  ): Promise<boolean> {
    return !!(await this.favoriteService.findOne({
      userId: userId,
      articleSlug: slug,
    }));
  }

  private async getArticleFavoritesCount(slug: string): Promise<number> {
    const options = mapQueriesToFindManyOptions<Favorite>({
      articleSlug: slug,
    });
    return await this.favoriteService.count(options);
  }

  mapToResponseArticle = async (
    requestUserId: string,
    article: Article
  ): Promise<IArticle> => {
    const user = await this.userService.findOne({ id: article?.authorId });
    return {
      ...article,
      favorited: await this.didUserFavoriteThisArticle(
        requestUserId,
        article?.slug
      ),
      favoritesCount: await this.getArticleFavoritesCount(article?.slug),
      author: await this.userService.getProfile(requestUserId, user),
    };
  };

  mapToResponseComment = async (
    requestUserId: string,
    comment: Comment
  ): Promise<IComment> => {
    const user = await this.userService.findOne({ id: comment?.authorId });
    return {
      ...comment,
      author: await this.userService.getProfile(requestUserId, user),
    };
  };
}

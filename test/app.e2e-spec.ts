import {
  INestApplication,
  ValidationPipe,
} from '@nestjs/common'
import { Test } from '@nestjs/testing'
import * as pactum from 'pactum'
import { PrismaService } from '../src/prisma/prisma.service'
import { AppModule } from '../src/app.module'
import { AuthDto } from 'src/auth/dto'
import { EditUserDto } from 'src/user/dto'
import {
  CreateBookmarkDto,
  EditBookmarkDto,
} from 'src/bookmark/dto'

describe('App e2e', () => {
  jest.setTimeout(200000)
  let app: INestApplication
  let prisma: PrismaService
  beforeAll(async () => {
    const moduleRef =
      await Test.createTestingModule({
        imports: [AppModule],
      }).compile()

    app = moduleRef.createNestApplication()
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
      }),
    )
    await app.init()
    await app.listen(8000)

    prisma = app.get(PrismaService)

    await prisma.cleanDb()

    pactum.request.setBaseUrl(
      'http://localhost:8000',
    )
  })

  afterAll(() => {
    app.close()
  })

  describe('Auth', () => {
    const dto: AuthDto = {
      email: 'test@gmail.com',
      password: '1234',
    }
    describe('Signup', () => {
      it('Should signup', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody(dto)
          .expectStatus(201)
      })
      it('should throw if email empty', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({
            email: '',
            password: dto.password,
          })
          .expectStatus(400)
      })
      it('should throw if password empty', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({
            email: dto.email,
            password: '',
          })
          .expectStatus(400)
      })
      it('should throw if both empty', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({
            email: '',
            password: '',
          })
          .expectStatus(400)
      })
    })

    describe('Signin', () => {
      it('Should signin', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody(dto)
          .expectStatus(200)
          .stores('userAt', 'access_token')
      })
      it('should throw if email empty', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({
            email: '',
            password: dto.password,
          })
          .expectStatus(400)
      })
      it('should throw if password empty', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({
            email: dto.email,
            password: '',
          })
          .expectStatus(400)
      })
      it('should throw if both empty', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({
            email: '',
            password: '',
          })
          .expectStatus(400)
      })
    })
  })

  describe('User', () => {
    describe('Get me', () => {
      it('should get current user', () => {
        return pactum
          .spec()
          .get('/users/me')
          .withHeaders({
            Authorization: `Bearer $S{userAt}`,
          })
          .expectStatus(200)
      })
    })

    describe('Edit user by ID', () => {
      it('should edit user', () => {
        const dto: EditUserDto = {
          firstName: 'Test',
          lastName: 'User',
        }
        return pactum
          .spec()
          .patch('/users')
          .withHeaders({
            Authorization: `Bearer $S{userAt}`,
          })
          .withBody(dto)
          .expectStatus(200)
      })
    })
  })

  describe('Bookmarks', () => {
    describe('Get empty boobmarks', () => {
      it('should get boobmarks', () => {
        return pactum
          .spec()
          .get('/bookmarks')
          .withHeaders({
            Authorization: `Bearer $S{userAt}`,
          })
          .expectStatus(200)
      })
    })

    describe('Create bookmark', () => {
      it('should create bookmark', () => {
        const dto: CreateBookmarkDto = {
          title: 'sample title',
          description: 'Sample description',
          link: 'http://example.com',
        }
        return pactum
          .spec()
          .post('/bookmarks')
          .withHeaders({
            Authorization: `Bearer $S{userAt}`,
          })
          .withBody(dto)
          .expectStatus(201)
          .stores('bookmarkId', 'id')
      })
    })

    describe('Get bookmarks', () => {
      it('should get boobmarks', () => {
        return pactum
          .spec()
          .get('/bookmarks')
          .withHeaders({
            Authorization: `Bearer $S{userAt}`,
          })
          .expectStatus(200)
          .inspect()
      })
    })

    describe('Get bookmark by ID', () => {
      it('should get bookmark by id', () => {
        return pactum
          .spec()
          .get('/bookmarks/{id}')
          .withPathParams('id', `$S{bookmarkId}`)
          .withHeaders({
            Authorization: `Bearer $S{userAt}`,
          })
          .expectStatus(200)
      })
    })

    describe('Edit Bookmark by ID', () => {
      it('should edit bookmark by id', () => {
        const dto: EditBookmarkDto = {
          title: 'another title',
        }
        return pactum
          .spec()
          .patch('/bookmarks/{id}')
          .withPathParams('id', `$S{bookmarkId}`)
          .withHeaders({
            Authorization: `Bearer $S{userAt}`,
          })
          .withBody(dto)
          .expectStatus(200)
      })
    })

    describe('Delete Bookmarks by ID', () => {
      it('should delete bookmark by id', () => {
        return pactum
          .spec()
          .delete('/bookmarks/{id}')
          .withPathParams('id', `$S{bookmarkId}`)
          .withHeaders({
            Authorization: `Bearer $S{userAt}`,
          })
          .expectStatus(204)
      })
    })
  })
})

import {
  ForbiddenException,
  Injectable,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import {
  CreateBookmarkDto,
  EditBookmarkDto,
} from './dto'

@Injectable()
export class BookmarkService {
  constructor(private prisma: PrismaService) {}

  async createBookmark(
    userId: string,
    dto: CreateBookmarkDto,
  ) {
    const bookmark =
      await this.prisma.bookmark.create({
        data: {
          userId,
          ...dto,
        },
      })

    return bookmark
  }

  getBookmarks(userId: string) {
    return this.prisma.bookmark.findMany({
      where: {
        userId,
      },
    })
  }

  async getBookmarkById(
    userId: string,
    bookmarkId: string,
  ) {
    return await this.prisma.bookmark.findFirst({
      where: {
        id: bookmarkId,
        userId,
      },
    })
  }

  async editBookmarkById(
    userId: string,
    bookmarkId: string,
    dto: EditBookmarkDto,
  ) {
    /*Get bookmark */
    const bookmark =
      await this.prisma.bookmark.findUnique({
        where: {
          id: bookmarkId,
        },
      })
    /*Check if user owns book mark */
    if (!bookmark || bookmark.userId !== userId)
      throw new ForbiddenException(
        'Access to resourses denied',
      )

    return this.prisma.bookmark.update({
      where: {
        id: bookmarkId,
      },
      data: {
        ...dto,
      },
    })
  }

  async deleteBookmarkById(
    userId: string,
    bookmarkId: string,
  ) {
    /*Find bookmark */
    const bookmark =
      await this.prisma.bookmark.findUnique({
        where: {
          id: bookmarkId,
        },
      })

    /*Check if user owns bookmark */
    if (!bookmark || bookmark.userId !== userId)
      throw new ForbiddenException(
        'Access to resourses denied',
      )

    return this.prisma.bookmark.delete({
      where: {
        id: bookmarkId,
      },
      select: {
        title: true,
      },
    })
  }
}

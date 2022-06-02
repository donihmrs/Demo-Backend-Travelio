const path = require('path');
const appDir = path.dirname(require.main.filename);
const lib = require(appDir+'/controller/lib')

const bookModel = require(appDir+'/model/BookModel')

const book = {}

book.saveWishlist = async (req, res, next) => {
    try {
        const { idBrowser, jsonBook } = req.body

        let data = {}
        data['id'] = idBrowser
        data['book'] = jsonBook

        const isExist = await bookModel.checkWishlist(data)
    
        if (isExist) {
            return res.status(200).send(lib.responseError(400,"Maaf, Anda sudah pernah menambahkan buku ini ke wishlist"))
        } else {
            const saveData = await bookModel.saveWishlist(data)
            if (saveData) {
                return res.status(200).send(lib.responseSuccess([],"Success, Anda berhasil menambahkan book ke wishlist"))
            } else {
                return res.status(200).send(lib.responseError(400,"Maaf, anda gagal menambahkan data ke wishlist"))
            }
        }
    } catch(err) {
        console.log(err)
        res.status(500).send(lib.responseError(500,"Maaf, ada kesalahan pada server"))
    }
}

book.delWishlist = async (req, res, next) => {
    try {
        const { idBrowser, jsonBook } = req.body

        let data = {}
        data['id'] = idBrowser
        data['book'] = jsonBook

        const deleteData = await bookModel.delWishlist(data)
        if (deleteData) {
            return res.status(200).send(lib.responseSuccess([],"Success, Anda berhasil menghapus data dari wishlist"))
        } else {
            return res.status(200).send(lib.responseError(400,"Maaf, anda gagal menghapus data dari wishlist"))
        }
    } catch(err) {
        console.log(err)
        res.status(500).send(lib.responseError(500,"Maaf, ada kesalahan pada server"))
    }
}

book.getWishlist = async (req, res, next) => {
    try {
        let data = {}
        data['id'] = req.query.id
        
        const getData =  await bookModel.getWishlist(data)
        
        res.status(200).send(lib.responseSuccess(getData,"Success, Anda berhasil get book dari wishlist"))
    } catch (err) {
        res.status(500).send(lib.responseError(500,"Maaf, tidak ada buku di wishlist"))
    }
}

book.getApiBook = async (req, res, next) => {
    try {
        let data = {}
        data['word'] = req.query.word
        
        if (req.query.word === "") {
            return res.status(200).send(lib.responseError(400,"Maaf, judul belum terisi"))
        }

        const getData =  await bookModel.getApiBook(data)

        if (getData.totalItems > 0 && getData !== false) {

            let tempArr = []
            for (const key in getData.items) {
                if (Object.hasOwnProperty.call(getData.items, key)) {
                    const ele = getData.items[key];
                    const dataInfo = ele.volumeInfo

                    let authorName = ""


                    let obj = {}
                    obj['id'] = ele.id
                    obj['title'] = (dataInfo.title === undefined ? "-" : dataInfo.title)

                    if (dataInfo.authors !== undefined) {
                        dataInfo.authors.forEach(author => {
                            authorName += author + ", "
                        });

                        if (authorName === "") {
                            obj['author'] = "Not Show"
                        } else {
                            obj['author'] = authorName
                        }
                    }

                    if (dataInfo.imageLinks !== undefined) {
                        obj['image_alt'] = obj['title'].replace(" ","-")
                        obj['image'] = (dataInfo.imageLinks.thumbnail !== undefined ? dataInfo.imageLinks.thumbnail : dataInfo.smallThumbnail)
                    } else {
                        obj['image_alt'] = "Not-Image"
                        obj['image'] = "https://www.totalsupply.com.au/assets/Uploads/220984-200.png"
                    }

                    obj['rating'] = (dataInfo.averageRating === undefined ? 0 : dataInfo.averageRating)
                    
                    obj['rating_count'] = (dataInfo.ratingsCount === undefined ? 0 : dataInfo.ratingsCount)
                    tempArr.push(obj)
                }
            }
            res.status(200).send(lib.responseSuccess(tempArr,"Success, Mengambil data buku dari API Google"))
        } else {
            res.status(400).send(lib.responseError(400,"Maaf, buku tidak ditemukan"))
        }
    } catch (err) {
        res.status(500).send(lib.responseError(500,"Maaf, ada kesalahan pada server"))
    }
}

module.exports = book;
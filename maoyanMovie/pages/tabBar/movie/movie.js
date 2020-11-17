const request = require('../../../utils/request')
const app = getApp()

Page({
  data: {
    city: '正在定位...',
    switchItem: 0, //默认选择‘正在热映’
    //‘正在热映’数据
    movieList0: [],
    movieIds0: [],
    loadComplete0: false, //‘正在上映’数据是否加载到最后一条
    //‘即将上映’数据
    mostExpectedList: [],
    movieList1: [],
    movieIds1: [],
    loadComplete1: false,
    loadComplete2: false //水平滚动加载的数据是否加载完毕
  },
  onLoad() {
    this.initPage()
  },
  initPage() {
    //https://www.jianshu.com/p/aaf65625fc9d   解释的很好
    if (app.globalData.userLocation) {
      this.setData({
        city: app.globalData.selectCity ? app.globalData.selectCity.cityName : '定位失败'
      })
    } else {
      app.userLocationReadyCallback = () => {
        this.setData({
          city: app.globalData.selectCity ? app.globalData.selectCity.cityName : '定位失败'
        })
      }
    }
    this.firstLoad()
  },
  onShow() {
    if (app.globalData.selectCity) {
      this.setData({
        city: app.globalData.selectCity.cityName
      })
    }
  },
  //上拉触底刷新
  onReachBottom() {
    const {
      switchItem,
      movieList0,
      movieIds0,
      loadComplete0,
      movieList1,
      movieIds1,
      loadComplete1
    } = this.data
    if (this.data.switchItem === 0) {
      this.ReachBottom(movieList0, movieIds0, loadComplete0, 0)
    } else {
      this.ReachBottom(movieList1, movieIds1, loadComplete1, 1)
    }
  },
  //第一次加载页面时请求‘正在热映的数据’
  async firstLoad() {
    wx.showLoading({
      title: '正在加载...'
    })
    const [res, err] = await request({
      api: '/mmdb/movie/v2/list/hot.json?limit=12&offset=0&ct=%E6%B2%B3%E6%BA%90'
    })
    if (!err) {
      const {
        hot = [], movieIds = []
      } = res.data
      const movieList0 = this.formatImgUrl(hot)
      
      this.setData({
        movieIds0: movieIds,
        movieList0
      })
      if (hot.length >= movieIds.length) {
        this.setData({
          loadComplete0: true
        })
      }
    }
    wx.hideLoading()
  },
  //切换swtch
  selectItem(e) {
    const item = e.currentTarget.dataset.item
    this.setData({
      switchItem: item
    })
    if (item === 1 && !this.data.mostExpectedList.length) {
      wx.showLoading({
        title: '正在加载...'
      })
      request({
        api: '/mmdb/movie/v1/list/wish/order/coming.json?ci=284&limit=30&offset=0'
      }).then(([res]) => {
        this.setData({
          mostExpectedList: this.formatImgUrl(res.data.coming || [], true)
        })
      }).finally(() => {
        wx.hideLoading()
      })
      request({
        api: '/mmdb/movie/v2/list/rt/order/coming.json?ci=284&limit=10'
      }).then(([res]) => {
        this.setData({
          movieIds1: res.data.movieIds || [],
          movieList1: this.formatImgUrl(res.data.coming || [])
        })
      })
    }
  },
  //上拉触底刷新的加载函数
  async ReachBottom(list, ids, complete, item) {
    if (complete) {
      return
    }
    const length = list.length
    if (length + 10 >= ids.length) {
      this.setData({
        [`loadComplete${item}`]: true
      })
    }
    let query = ids.slice(length, length + 10).join('%2C')
    //const url = `https://m.maoyan.com/ajax/moreComingList?token=&movieIds=${query}`
    const [res,err] = await request({
      api:`/mmdb/movie/list/info.json?ci=284&movieIds=${query}`
    })
    if(!err){
      const arr = list.concat(this.formatImgUrl(res.data.movies || []))
      this.setData({
        [`movieList${item}`]: arr,
      })
    }
  },
  //滚动到最右边时的事件处理函数
  /**async lower() {
    const {
      mostExpectedList,
      loadComplete2
    } = this.data
    const length = mostExpectedList.length
    if (loadComplete2) {
      return
    }
    const [res, err] = await request({
      api: "/ajax/mostExpected",
      data: {
        limit: 10,
        offset: length,
        token:''
      }
    })
    if (!err) {
      this.setData({
        mostExpectedList: mostExpectedList.concat(this.formatImgUrl(res.coming || [], true)),
        loadComplete2: !res.paging.hasMore || !res.coming.length //当返回的数组长度为0时也认为数据请求完毕
      })
    }
  },*/
  //处理图片url
  formatImgUrl(arr, cutTitle = false) {
    //小程序不能在{{}}调用函数，所以我们只能在获取API的数据时处理，而不能在wx:for的每一项中处理
    if (!Array.isArray(arr)) {
      return
    }
    let newArr = []
    arr.forEach(item => {
      let title = item.comingTitle
      if (cutTitle) {
        title = item.comingTitle.split(' ')[0]
      }
      let imgUrl = item.img.replace('w.h', '128.180')
      newArr.push({
        ...item,
        comingTitle: title,
        img: imgUrl
      })
    })
    return newArr
  },
  //转发
  onShareAppMessage(res) {
    return {
      title: '快来看看附近的电影院',
      path: 'pages/tabBar/movie/movie'
    }
  }
})
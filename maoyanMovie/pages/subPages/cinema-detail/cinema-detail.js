const util = require('../../../utils/util.js')
const request = require('../../../utils/request.js')
const formatNumber = util.formatNumber
const getRandom = util.getRandom
Page({
  data: {
    cinemaId: '',
    movieId: '',
    cinemaDetail: null, //影院详情
    movie: null, //选中的电影
    movies:null, //电影列表
    days: [], //该电影的排片日期列表
    timeList: [], //当天播放电影的时间段
    divideDealList: [], //影院分类零食列表
    first:true, //只在第一次提示
    cinemaData: null
  }, 
  onLoad(query) {
   this.initPage(query)
  },
  //初始化页面
  initPage(query) {
    const _this = this
    const { cinemaId = '' } = query
    _this.setData({
      cinemaId,
    })
    this.getCinemaData(cinemaId)
    request({
      url: `https://m.maoyan.com/hostproxy/mmcs/show/v2/cinema/shows.json?cinemaId=${cinemaId}&ci=284`,
    }).then(([res]) => { 
      _this.setData({
        cinemaDetail : res.data,
        movies: this.formatMovie(res.data.movies),
      })
    })
  },
  getCinemaData(cinemaId){
    const _this = this
    request({
      url:`https://m.maoyan.com/hostproxy/mmcs/cinema/v0/cinema.json?cinemaId=${cinemaId}&channelId=40000`,
    }).then(([res]) => {
      _this.setData({
        cinemaData : res.data
      })
    })
  },
  //选择电影
  selectMovie(e) {
    const movie = e.detail.movie
    let days = []
    movie.shows.forEach(item => {
      days.push({
        title: item.showDate,
        day: item.showDate
      })
    })
    this.setData({
      movie,
      days,
      timeList: this.createEndTime(movie.shows[0].plist, movie.dur)
    })
  },
  //选择时间
  selectDay(e) {
    const day = e.detail.day
    const movie = this.data.movie
    const index = movie.shows.findIndex(item => item.showDate === day)
    this.setData({
      timeList: this.createEndTime(movie.shows[index].plist, movie.dur)
    })
  },
  //跳转到“套餐详情”页面
  goSnackPage(e){
    const info = e.currentTarget.dataset.info;
    //将参数转化为JSON通过页面跳转时传递
    const paramsStr = JSON.stringify({
      cinemaName: this.data.cinemaDetail.cinemaName,
      cinemaId: this.data.cinemaId,
      dealId: info.dealId,
      cinemaData: this.data.cinemaDetail.cinemaData//影院信息
    })
    wx.navigateTo({
      url: `/pages/subPages/snack-page/snack-page?paramsStr=${paramsStr}`,
    })
  },
  //购票
  buyTicket(e){
    const info = e.currentTarget.dataset.info;
    const { movie, cinemaId, cinemaDetail,first} =  this.data
    //添加订单信息
    const paramsStr = JSON.stringify({
      cinemaName: cinemaDetail.cinemaName,//电影院名
      cinemaId: cinemaId,//电影院ID
      hall:info.th,//大厅
      movieName: movie.nm,//电影名
      movieImg:movie.img,//海报
      lang: info.lang+info.tp,//语言
      time: `${info.dt} ${info.tm}`,//时间
      price: (info.vipPrice && info.vipPrice * 1 + 10) || 37,//票价
      seat: `${getRandom(1, 21,true)}排${getRandom(1, 21,true)}座`,//座位
      Vcode: getRandom(100000,999999), //模拟6位数的验证码
      flowNumber: getRandom(100000000, 999999999), //模拟9位数的流水号,
      orderId: getRandom(1000000000, 9999999999), //模拟10位数的订单号,
      cinemaData: cinemaDetail.cinemaData//影院信息
    })
    // 只提示一次
    if (first){
      wx.showModal({
        title: '提示',
        content: '此小程序仅为学习，不会产生任何支付',
        success: (res) => {
          this.setData({
            first:false
          })
          if (res.confirm) {
            wx.navigateTo({
              url: `/pages/subPages/buy-ticket/buy-ticket?paramsStr=${paramsStr}`,
            })
          }
        }
      })
    } else {
      wx.navigateTo({
        url: `/pages/subPages/buy-ticket/buy-ticket?paramsStr=${paramsStr}`,
      })
    }
  },
  //处理散场时间
  createEndTime(arr, dur) {
    let timeList = []
    if (Array.isArray(arr)) {
      timeList = arr.map(item => {
        let temp = { ...item
        }
        let time = new Date(`${item.dt} ${item.tm}`)
        time = time.setMinutes(time.getMinutes() + dur)
        const endTime = new Date(time)
        temp.endTime = `${formatNumber(endTime.getHours())}:${formatNumber(endTime.getMinutes())}`
        return temp
      })
    }
    return timeList
  },
  //处理电影图片的url
  formatMovie(arr){
    let list = []
    if (Array.isArray(arr)) {
      arr.forEach(item => {
        list.push({
          ...item,
          img: item.img.replace('w.h', '148.208')
        })
      })
    }
    return list
  },
  //处理零食图片的url
  formatUrl(arr) {
    let divideDealList = []
    if (Array.isArray(arr)) {
      arr.forEach(item => {
        let temp = {
          ...item
        }
        temp.dealList = temp.dealList.map(i => ({
          ...i,
          imageUrl: i.imageUrl.replace('w.h', '440.0')
        }))
        divideDealList.push(temp)
      })
    }
    return divideDealList
  },
})
const util = require('../../../utils/util.js')
const request = require('../../../utils/request')

const app = getApp();
Page({
  data: {
    city: '正在定位...',
    params: { //url请求参数对象
      day: util.getToday(),
      offset: 0,
      limit: 20,
      districtId: -1,
      lineId: -1,
      hallType: -1,
      brandId: -1,
      serviceId: -1,
      areaId: -1,
      stationId: -1,
      item: '',
      updateShowDay: false
    },
    nothing: false, //结果是否为空
    cinemas: [], //影院列表
    loadComplete: false, //数据是否加载完
    cinemaId: '',
    movies: null
  },
  onLoad() {
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
    this.initPage()
  },
  onShow() {
    if (app.globalData.selectCity) {
      this.setData({
        city: app.globalData.selectCity.cityName
      })
    }
  },
  //初始化页面
  initPage() {
    this.getCinemas(this.data.params).then(function () {
      wx.hideLoading();
    })
  
  },
  
  //获取影院列表
  getCinemas(params) {
    const _this = this;
    request({
      url: 'https://m.maoyan.com/hostproxy/mmcs/cinema/v1/select/cinemas.json?cityId=284&limit=12&offset=0&channelId=40000&lng=114.70246&lat=23.73417',
      data:params,
    }).then(([res]) => {
      _this.setData({
        cinemas : _this.data.cinemas.concat(res.data.cinemas),
        cinemaId : res.data.cinemas.id
      })
    })
  },
  
  //当过滤条件变化时调用的函数
  changeCondition(e) {
    const obj = e.detail
    wx.showLoading({
      title: '正在加载...'
    })
    this.setData({
      params: { ...this.data.params,
        ...obj
      },
      cinemas: [],
      nothing: false
    }, () => {
      this.getCinemas(this.data.params).then((list) => {
        if (!list.length) {
          this.setData({
            nothing: true
          })
        }
        wx.hideLoading()
      })
    })
  },
  //导航下拉框状态变化时的处理
 
  //上拉触底加载更多
  onReachBottom() {
    if (this.data.loadComplete) {
      return
    }
    const params = {...this.data.params, offset:this.data.cinemas.length}
    this.getCinemas(params)
  },
  //转发
  onShareAppMessage(res) {
    return {
      title: '最近上映的这些电影你都看了吗？',
      path: 'pages/tabBar/movie/movie'
    }
  }
})
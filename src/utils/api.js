import axios from 'axios'
import {Message} from 'element-ui';
import router from '../router'


// 请求超时时间
axios.defaults.timeout = 10000;
// post请求头
axios.defaults.baseURL = '/api';
axios.defaults.headers.post['Content-Type'] = 'application/json;charset=utf-8';
// request interceptor
axios.interceptors.request.use(
    config => {
        //config.headers['content-type'] = 'application/json; charset=utf-8'
        // config.headers.dataType = 'json'
        if (sessionStorage.getItem('token')) {
            //  存在将api_token写入 request header
            config.headers.Authorization = `Bearer ${sessionStorage.getItem('token')}`
        }
        return config
    }
)

axios.interceptors.response.use(success => {
    // console.log(success)
    // 后端有全局异常捕获，后端异常前端接到仍是200，错误信息错误码在data中
    if (success.status && success.status === 200 && success.data.code !== 200) {
        Message.error({message: success.data.desc})
        if (success.data.code === 401) {
            // 401重定向到登陆页面
            router.push({name: 'login'});
        }
    }
    return success.data;
}, error => {
    console.log(error)
    if (error.response.status === 504 || error.response.status === 404) {
        Message.error({message: '服务器被吃了( ╯□╰ )'})
    } else if (error.response.status === 403) {
        Message.error({message: '权限不足，请联系管理员'})
    } else if (error.response.status === 401) {
        Message.error({message: '尚未登录，请登录'})
        router.push({name: 'login'});
    } else {
        if (error.response.data.desc) {
            Message.error({message: error.response.data.desc})
        } else {
            Message.error({message: '未知错误!'})
        }
    }
    return error.data;
})

let base = '';

export const jsonPost = (url, params) => {
    return axios({
        method: 'post',
        url: `${base}${url}`,
        data: params,
    });
}

export const getRequest = (url, params) => {
    return new Promise((resolve, reject) => {
        axios({
            method: 'get',
            params: params,
            url: `${base}${url}`
        }).then(res => {
            resolve(res)
        }).catch(err => {
            reject(err)
        })
    })
}
/*
上传一共分三步:
1、获取token
2、上传文件到七牛
3、保存文件信息和七牛返回的信息到a1_file_info（instance信息这时是空的，instance保存时再更新）
 */
export const uploadFileRequest = (file) => {
    return new Promise(function (resolve, reject) {
        getRequest("/auth/admin/getUploadToken", {}).then(res => {
            if (res.code && res.code == 200) {
                let fd = new FormData()
                fd.append("file", file)
                fd.append("token", res.data)
                uploadToQINIU(fd).then(upRes => {
                    console.log(upRes)
                    let fileInfo = {
                        instanceType: "GOODS_PICTURE",
                        fileSize: file.size,
                        mimeType: file.type,
                        fileHash: upRes.hash,
                        fileKey: upRes.key
                    }
                    jsonPost("/fileInfo/add", fileInfo).then(addRes => {
                        resolve(addRes)
                    }).catch(
                        reject(addRes)
                    )
                })
            } else {
                Message.error({type: 'error', message: '获取上传token失败!'})
            }
        })
    })
}

function uploadToQINIU(formData) {
    return axios({
        method: 'post',
        url: 'http://upload.qiniup.com',
        data: formData,
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    })
}

export const putRequest = (url, params) => {
    return axios({
        method: 'put',
        url: `${base}${url}`,
        data: params,
        transformRequest: [function (data) {
            let ret = ''
            for (let it in data) {
                ret += encodeURIComponent(it) + '=' + encodeURIComponent(data[it]) + '&'
            }
            return ret
        }],
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    })
}
export const deleteRequest = (url) => {
    return axios({
        method: 'delete',
        url: `${base}${url}`
    });
}
export const formPost = (url, params) => {
    return axios({
        method: 'post',
        url: `${base}${url}`,
        data: params,
        transformRequest: [function (data) {
            // Do whatever you want to transform the data
            let ret = ''
            for (let it in data) {
                ret += encodeURIComponent(it) + '=' + encodeURIComponent(data[it]) + '&'
            }
            return ret
        }],
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    });
}

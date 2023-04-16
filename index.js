const axios = require("axios")


// token
const authorization = "eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOjExNTk3NiwidXVpZCI6ImY5NmZlZDgzLTkyZjgtNDVkNS05ZTQzLWYwMDEzN2M1YmM2NSIsImlzX2FkbWluIjpmYWxzZSwiaXNfc3VwZXJfYWRtaW4iOmZhbHNlLCJzdWJfbmFtZSI6IiIsInRlbmFudCI6ImF1dG9kbCIsInVwayI6IiJ9.gzDYokTAsthTvwbPgrr6VHAx496A-6FXqyiF8AEY2iUnVCUaUnR716BrDgVjUpHzRJvsAmyIidGzppascD5vow"
const list_origin = "https://www.autodl.com"
const list_referer = "https://www.autodl.com/market/list"
const contentType = "application/json;charset=UTF-8"
// 想抢的显卡筛选，如果是all in，则[]
// RTX 3090, RTX 4090, RTX 4090(抢先版)
const GPU = ["Tesla T4", "RTX 4090"]

const image_type = "hub.kce.ksyun.com/autodl-image/torch:cuda11.3-cudnn8-devel-ubuntu20.04-py38-torch1.10.0"

// 想租的显卡数
const gpu_num = 8
// 每台机子的最大显卡数，3090和4090都是8
const max_gpu = 8

const maps = {
    "佛山区": 1,
    "内蒙A区": 1,
    "芜湖区": 1,
    "北京A区": 1,
    "北京C区": 1,
    "毕业季A区": 1,
    "南京新手区": 1,
    "特惠/泉州A区": 1,
    "深圳A区": 1,
    "潮汐算力": 1,
    "宿迁企业区": 1
}


async function runner(){
    const area_list = await axios({
        method: "get",
        url: "https://www.autodl.com/api/v1/region/list",
        headers: {
            authorization,
            origin: list_origin,
            referer: list_referer,
            "content-type": contentType
        }
    })

    // beijing-B
    let region_sign = "foshan-A"

    for (const o of area_list.data.data){
        if(!maps[o.region_name]){
            region_sign = o.region_sign
            break
        }
    }

    if(region_sign === ""){
        console.log("西北新区在哪里，我不到啊")
        return 
    }


    let machine_id = 0
    let page_index = 0
    
    while(machine_id === 0){


        const mlist = await axios({
            method: "post",
            url: "https://www.autodl.com/api/v1/user/machine/list",
            headers: {
                authorization,
                origin: "https://www.autodl.com",
                referer: "https://www.autodl.com/market/list",
                "content-type": "application/json;charset=UTF-8"
            },
            data: { "charge_type": "payg", "region_sign": "", "gpu_type_name": GPU, "machine_tag_name": [], "gpu_idle_num": 1, "mount_net_disk": false, "instance_disk_size_order": "", "date_range": "", "date_from": "", "date_to": "", "page_index": page_index++, "page_size": 10, "pay_price_order": "", "gpu_idle_type": "", "default_order": true, "region_sign_list": [`${region_sign}`] }
        })

        if(mlist.data.data.list.length === 0){
            console.log("预设的显卡已经无了")
            return
        }

        console.log("runner")
    
        for (let o of mlist.data.data.list) {
            if(o.gpu_number === 4 && o.gpu_used === 0){
                machine_id = o.machine_id
                break;
            }
        }
    }


    // 获取设备名单
    const alist = await axios({
        method: "post",
        url: "https://www.autodl.com/api/v1/user/machine/list",
        headers: {
            authorization,
            origin: "https://www.autodl.com",
            referer: "https://www.autodl.com/market/list",
            "content-type": "application/json;charset=UTF-8"
        },
        data: { "charge_type": "payg", "region_sign": "", "gpu_type_name": ["RTX 3090"], "machine_tag_name": [], "gpu_idle_num": 1, "mount_net_disk": false, "instance_disk_size_order": "", "date_range": "", "date_from": "", "date_to": "", "page_index": 6, "page_size": 10, "pay_price_order": "", "gpu_idle_type": "", "default_order": true, "region_sign_list": [`${region_sign}`] }
    })




    for (let o of alist.data.data.list) {
        if(o.gpu_number === max_gpu && gpu_used === 0){
            machine_id = o.machine_id
            break;
        }
    }

    console.log(machine_id)

    // 支付
    axios({
        url: "https://www.autodl.com/api/v1/order/instance/create/payg",
        method: "POST",
        headers: {
            authorization,
            origin: "https://www.autodl.com",
            referer: "https://www.autodl.com/create/foshan-A/" + machine_id + "/1/payg",
            "content-type": "application/json;charset=UTF-8"
        },
        data: {"instance_info":{"machine_id": machine_id,"charge_type":"payg","req_gpu_amount": gpu_num,"image": image_type,"private_image_uuid":"","reproduction_uuid":"","instance_name":"","expand_data_disk":0},"price_info":{"coupon_id_list":[],"machine_id": machine_id,"charge_type":"payg","duration":1,"num": gpu_num,"expand_data_disk":0}}
    }).then(res => {
        console.log(res.data)
    }).catch(err => {
        console.error("error", err)
    })
}


runner()
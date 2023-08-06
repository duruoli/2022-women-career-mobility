import React, { FunctionComponent as FC, useRef} from 'react';
import { useSelector } from 'react-redux';
import { State } from '../../../../state';
import './index.scss';
import _ from 'lodash';

import { MainViewTypes } from '../../../../types/data';
import { globalStyle } from '../../../../types/data.global';

interface CareerflowUnitUnfoldProps {
  data: MainViewTypes.FlowType;
  height: number;
  svgWidth: number;
  flowType: string;
}

interface SeqCountsType {
  [key: string]: number;
}
interface InfoType {
  [key:string]: {
    sum_dr: number,
    avg_dr:number,
    sum_n: number,
    [key: string]:any}
}
interface DrawInfoType {
  [key:string]:{
    x: number,
    y: number,
    height: number,
    width: number,
    [key: string]:any,
  }
}
interface DrawInfoInputType {
  x: number,
  y: number,
  height: number,
  width: number,
  [key: string]:any,
}

interface DrawKeyGroupType {
  [key: number]:string[]
}

const CareerflowUnitUnfold: FC<CareerflowUnitUnfoldProps> = (props) => {
  const { data, height, svgWidth, flowType } = props

  const freqThred: number = useSelector((state: State) => state.uiReducer?.careerflowFreqThred) as number
  const careerflowModeWithUnchange: boolean = useSelector((state: State) => state.uiReducer?.careerflowModeWithUnchange) as boolean

  // const svgWidth: number = globalStyle.careerflowSvgWidth
  let flowColor = globalStyle.incomeQuantileColorDict
  if (flowType === 'life-event') {
    flowColor = globalStyle.lifeEventColorDict
  }
  const flowFillOpacity: number = 0.5
  const nodeFillOpacity: number = 1
  const svgRef = useRef(null as SVGSVGElement| null)
  const nodeGroupRef = useRef(null as SVGGElement | null)
  const flowGroupRef = useRef(null as SVGGElement | null)

    // 函数准备
  /// 获取所有index的fun
  const getAllIndice = (arr:string[], val:string, freq: number ):[string,number[],number] => {
    let indice:number[] = [], i = -1;
    while((i = arr.indexOf(val, i+1)) !== -1) {
      indice.push(i);
    }
    return [val, indice, freq];
  }
  /// 替换string event为"数字"的fun
  const mapReplace = (str: string, map: any) => {
    const matchStr = Object.keys(map).join('|');
    if (!matchStr) return str;
    const regexp = new RegExp(matchStr, 'g');
    return str.toString().replace(regexp, match => map[match]);
  };

  const map = {
    'education':'a',
    'first_job':'b',
    'single_couple':'c',
    'couple_single':'d',
    'single_single':'e',
    'childbearing_no_yes':'f',
    'childbearing_yes_no':'g',
    'has_migration':'h',
    'noncentral_central':'i',
    'central_noncentral':'j',
  }

  // 1. process data (position data)

  const careerflowUnfoldInputData = (rawdata: MainViewTypes.FlowType, height: number) => {
    const careerFlowSequence = rawdata.career_flow.map(d=> d['sequence'].filter(pair => pair['duration']>0))
    const drArray = careerFlowSequence.map(d => d.map(x => x.duration))
    let seqArray: string[] = []
    if(flowType === "life-event"){
      // map long string name to one
      seqArray = careerFlowSequence.map(d => d.map(x => x.event).join('')).map(s => mapReplace(s, map))
    }else{
      seqArray = careerFlowSequence.map(d => d.map(x => x.event).join(''))
    }
    if(flowType === "life-event")
      console.log('raw:',rawdata)
    // 找出freq>=10的seq 是list
    const seqCounts: SeqCountsType = {} //计算seq的freq
    seqArray.forEach(cur => {
      if (!seqCounts[cur])
      seqCounts[cur] = 1
      else
      seqCounts[cur]++
    });

    let targetSeq:[string, number][] = []
    if (careerflowModeWithUnchange) {  // mode1:考虑所有满足freq >= freqThred
      targetSeq = Object.entries(seqCounts)//直接转化为[[key,value],...]，找到目标的seq
        .filter((value, idx) => {
          if (value[1] < freqThred) {
            return false
          }
          return true;
        })
    } else {  // mode2:只考虑至少变化一次的
      targetSeq = Object.entries(seqCounts)//直接转化为[[key,value],...]，找到目标的seq
        .filter((value, idx) => {
          if ( value[1] < freqThred || value[0].length === 1) {
            return false
          }
          return true
        })
    }

    //把同属于一个pattern seq的人的duration list nest起来
    type NestDrArray = [string, number[][], number][]
    const nestDrArray: NestDrArray = targetSeq.map(d => getAllIndice(seqArray, d[0], d[1])).map(pair =>[pair[0], pair[1].map(idx => drArray[idx]), pair[2]])
    const sumDrArray: [string, number[], number][] = nestDrArray.map(d => [d[0], d[1][0].map((x, idx) => d[1].reduce((sum, curr) => sum + curr[idx], 0)), d[2]]) //属于同一个seq pattern的duration和的list

    /// 计算node, flow的坐标、width、height
    // 1. 计算width_unit, height_unit
    /// 画图基本信息
    const targetN = _.sum(sumDrArray.map(d=>d[2]))
    const heightUnit = height/targetN
    const nodeWidth = 7
    const borderWidth = 1

    // 2. 计算duration
    const sumDrArrayPlus0: [string, number[], number][] = sumDrArray.map(d => [d[0]+'0', d[1], d[2]]) //以0作为结束的标记
    const maxSeqLen: number = _.max(targetSeq.map(s => s[0].length)) as number // 得到最长的pattern，获得循环的结点，一定是target sequence里！
    // 思路: 获取长度2到maxSeqLen的“积木”对应的duration，同时这些积木可以组成所需数据：1-2-3-4=“12”+“123”+“1234”+“12340”（1，2，3，4的avg duration）
    //最重要的object，储存位置信息
    const infoObj: InfoType = {}
    for (let i = 1; i <= maxSeqLen + 1; i++) { //因为sumDrArray已经plus0了，最长要比maxSeqLen长1
      let Array0 = sumDrArrayPlus0.filter(pair => pair[0].length>=i)
      Array0.forEach(pair => {
        let key = pair[0].slice(0,i)
        let drInfo = pair[1]
        let peopleN = pair[2]
        if (i === 1) {
          if (!infoObj[key]) {
            infoObj[key] = {sum_dr: 0, avg_dr: 0, sum_n: 0}
            infoObj[key]["sum_n"] = peopleN
          } else {
            infoObj[key]["sum_n"] = infoObj[key]["sum_n"] + peopleN
          }
        } else {
          if (!infoObj[key]) {
          infoObj[key] = {sum_dr: 0, avg_dr:0, sum_n: 0}
          infoObj[key]["sum_dr"] = drInfo[i-2];
          infoObj[key]["sum_n"] = peopleN
        } else {
          infoObj[key]["sum_dr"] = infoObj[key]["sum_dr"]+drInfo[i-2];
          infoObj[key]["sum_n"] = infoObj[key]["sum_n"]+peopleN
        }
        }

        //获得avg_dr
        Object.keys(infoObj).forEach(key => {
          infoObj[key]["avg_dr"] = infoObj[key]["sum_dr"]/infoObj[key]["sum_n"]
        })
      })
    }
    // 计算最长的seq
    function splitFun(seq: string) { //建立将seq分解为一节一节“积木”的函数，以便组装
      let l0: string[] = []
      for(let i = 1; i < seq.length; i++) {
        l0.push(seq.slice(0,i+1))
      }
      return l0;
    }
    const targetSeqPlus0 = targetSeq.map(pair => pair[0]+'0')
    const widthSumArray:[string, number][] = []
    targetSeqPlus0.forEach(seq => {
      widthSumArray.push([seq.slice(0,-1), _.sum(splitFun(seq).map(s => {
        if (infoObj[s])
          return infoObj[s]["avg_dr"]}))])
    })
    const widthUnit = _.min(widthSumArray.map(pair => (svgWidth-pair[0].length*nodeWidth)/pair[1])) as number

    // 3. 计算坐标
    //思路：一个node带一组flow（e.g. node:1+(flow:1-0,1-1,1-2,...)）node:1-2指的是node2的位置 vs flow:1-2指的是1的duration
    const nodeDrawInfo: DrawInfoType = {}
    const flowDrawInfo: DrawInfoType = {}
    //将“积木”按长度分类(node和flow不一样，因为node不用画0结尾的，但flow要画)
    const nodeKey = Object.keys(infoObj).filter(seq => seq.slice(-1) !== '0')
    const nodeKeyGroup: DrawKeyGroupType = {} //分组的keys, 长度比targetSeq要长，e.g. 1-2-3-4中取出来的1-2-3积木，但实际上并没有1-2-3
    for(let i = 1; i <= maxSeqLen; i++) {
      nodeKeyGroup[i] = nodeKey.filter(key=>key.length === i)
    }
    const flowKeyGroup: DrawKeyGroupType = {}
    for(let i = 2; i <= maxSeqLen + 1; i++) {
      flowKeyGroup[i] = Object.keys(infoObj).filter(key=>key.length === i)
    }

    //计算绘图坐标
    for (let i = 1; i <= maxSeqLen; i++) { //i只是长度
      const nodeKeys = nodeKeyGroup[i]
      nodeKeys.reverse()
      nodeKeys.forEach((node,node_idx) => {
        nodeDrawInfo[node] = {x:0, y:0, width:0, height:0, label:node.slice(-1)}
        const flowKeys = flowKeyGroup[i+1].filter(key => key.slice(0,i) === node) //获取属于该node的flow
        flowKeys.reverse()
        nodeDrawInfo[node]["width"] = nodeWidth
        nodeDrawInfo[node]["height"] = infoObj[node]["sum_n"]*heightUnit
        if (i === 1) {
          if (node_idx === 0) {
            nodeDrawInfo[node]["y"] = 0
          } else {
            const prevNode = nodeKeys[node_idx-1] //得到前一个node，便于迭代（只有idx>0时有prev）
            nodeDrawInfo[node]["y"] = nodeDrawInfo[prevNode]["y"]+nodeDrawInfo[prevNode]["height"]
          }
          flowKeys.forEach((flow, flow_idx) => {
            flowDrawInfo[flow] = {x:0, y:0, width:0, height:0}
            flowDrawInfo[flow]["width"] = infoObj[flow]["avg_dr"]*widthUnit
            flowDrawInfo[flow]["height"] = infoObj[flow]["sum_n"]*heightUnit
            flowDrawInfo[flow]["label"] = nodeDrawInfo[node]["label"]
            flowDrawInfo[flow]["x"] = nodeDrawInfo[node]["x"]+nodeWidth //通用（不论是否为第一步）
            if (flow_idx === 0) {
              flowDrawInfo[flow]["y"] = nodeDrawInfo[node]["y"]
            } else {
              const prevFlow = flowKeys[flow_idx-1]
              flowDrawInfo[flow]["y"] = flowDrawInfo[prevFlow]["y"]+flowDrawInfo[prevFlow]["height"]
            }
          })
        } else {//当不是第一阶段的时候，node的y不需要分node_idx=0?考虑
          const prevStageNode = node.slice(0,i-1)
          nodeDrawInfo[node]["x"] = nodeDrawInfo[prevStageNode]["x"]+nodeWidth+flowDrawInfo[node]["width"]
          nodeDrawInfo[node]["y"] = flowDrawInfo[node]["y"] //这一阶段的node的y和它上一阶段的flow的y是一致的
          nodeDrawInfo[node]["width"] = nodeWidth
          nodeDrawInfo[node]["height"] = infoObj[node]["sum_n"]*heightUnit
          flowKeys.forEach((flow, flow_idx) => {
            flowDrawInfo[flow] = {x:0, y:0, width:0, height:0}
            flowDrawInfo[flow]["label"] = nodeDrawInfo[node]["label"]
            flowDrawInfo[flow]["width"] = infoObj[flow]["avg_dr"]*widthUnit
            flowDrawInfo[flow]["height"] = infoObj[flow]["sum_n"]*heightUnit
            flowDrawInfo[flow]["x"] = nodeDrawInfo[node]["x"]+nodeWidth //通用（不论是否为第一步）
            if (flow_idx === 0) {
              flowDrawInfo[flow]["y"] = nodeDrawInfo[node]["y"]
            } else {
              const prevFlow = flowKeys[flow_idx-1]
              flowDrawInfo[flow]["y"] = flowDrawInfo[prevFlow]["y"]+flowDrawInfo[prevFlow]["height"]
            }
          })
        }
      })
    } //生成位置信息循环的末尾

    return {node: nodeDrawInfo, flow: flowDrawInfo}

  }// 生成所需data 主function的末尾
  const unfoldInputData = careerflowUnfoldInputData(data, height)
  const nodeDrawInfo: DrawInfoInputType[] = Object.values(unfoldInputData.node)
  const flowDrawInfo: DrawInfoInputType[] = Object.values(unfoldInputData.flow)
  // console.log('node,flow:',nodeDrawInfo,flowDrawInfo)
  // 2. draw flow
  const linearGradientList: JSX.Element[] = []
  _.forEach(flowColor, (color: string, quantile: string) => {
    linearGradientList.push(
      <defs key={ quantile }>
        <linearGradient id={ quantile } x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: color, stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: color, stopOpacity: 1 }} />
        </linearGradient>
      </defs>
    )
  })

  const nodeElementList: JSX.Element[] = nodeDrawInfo.map((nodeUnit: DrawInfoInputType, index: number) =>
    <rect key={index} className='node-unit'
          x={nodeUnit.x} y={nodeUnit.y}
          width={nodeUnit.width} height={nodeUnit.height}
          fill={flowColor[nodeUnit.label]}
          fillOpacity={nodeFillOpacity}
          stroke='white' strokeWidth={Math.min(0.8, nodeUnit.height/5)}
          rx={1.5} ry={1.5}
    />
  )
  const flowElementList: JSX.Element[] = flowDrawInfo.map((flowUnit: DrawInfoInputType, index: number) =>
    <rect key={index} className='flow-unit'
          x={flowUnit.x} y={flowUnit.y}
          width={flowUnit.width} height={flowUnit.height}
          // fill={flowColor[flowUnit.label]}
          fill={`url(#${flowUnit.label})`}
          fillOpacity={flowFillOpacity}
          stroke='white' strokeWidth={Math.min(0.8, flowUnit.height/5)}
    />
  )

  return (
    <svg ref={svgRef} style={{ width: svgWidth }} className='careerflowunitunfold-svg'>
      <g ref={flowGroupRef} className='flow-g'>{flowElementList}</g>
      <g ref={nodeGroupRef} className='node-g'>{nodeElementList}</g>
      {linearGradientList}
      {/* <defs>
        <linearGradient id="1" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: '#DAA36C', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#DAA36C', stopOpacity: 0 }} />
        </linearGradient>
      </defs> */}
    </svg>
  )
}

export default CareerflowUnitUnfold;
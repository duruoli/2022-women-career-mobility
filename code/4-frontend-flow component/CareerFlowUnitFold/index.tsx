import React, { FunctionComponent } from 'react';
import './index.scss';

import { MainViewTypes } from '../../../../types/data';
import { globalStyle } from '../../../../types/data.global';
import _ from 'lodash';

interface CareerflowUnitFoldProps {
  data: MainViewTypes.FlowType,
  height: number,
}

interface QuantileProportion {
  [quantile: number | string]: number,
}

const CareerflowUnitFold: FunctionComponent<CareerflowUnitFoldProps> = (props) => {

  const { data, height } = props

  // 1. process data: get quantile proportions
  const quantileProportionList: QuantileProportion = {}
  const sortKey = (obj: any) => _(obj).toPairs().sortBy(0).fromPairs().value()
  const getQuantileDuration = (seq: MainViewTypes.CareerUnit[]) => {
    const quantileDurationList: QuantileProportion = {}
    _.forEach(seq, (e) => {
      if (!_.has(quantileDurationList, e.event)) {
        quantileDurationList[e.event] = e.duration
      } else {
        quantileDurationList[e.event] = e.duration + quantileDurationList[e.event]
      }
    })
    return(sortKey(quantileDurationList))
  }
  _.forEach(data.career_flow, (personData: MainViewTypes.CareerSequenceUnit) => {
    // 1. get quantile-duration dict for each person
    const careerDurationSeq: MainViewTypes.CareerUnit[] = personData.sequence
    const quantileDurationDict: QuantileProportion = getQuantileDuration(careerDurationSeq)

    // 2. get person label (quantile with the longest duration)
    const personLabel = {
      quantile: '',
      duration: -1,
    }
    _.forEach(quantileDurationDict, (duration: number, quantile: string) => {
      if (personLabel.duration < duration) {
        personLabel.quantile = quantile
        personLabel.duration = duration
      }
    })

    // 3. update quantileProportionList
    if (!_.has(quantileProportionList, personLabel.quantile)) {
      quantileProportionList[personLabel.quantile] = 1
    } else {
      quantileProportionList[personLabel.quantile] = 1 + quantileProportionList[personLabel.quantile]
    }
  })

  // 2. draw div list
  const totalPopulation: number = _.sumBy(Object.values(quantileProportionList))
  const proportionDivList: JSX.Element[] = []
  _.forEach(quantileProportionList, (population: number, quantile: string) => {
    const widthProportion: number = population / totalPopulation * 100
    proportionDivList.push(
      <div key={quantile}
        className='population-div-unit'
        style={{
          width: `${widthProportion}%`,
          backgroundColor: globalStyle.incomeQuantileColorDict[quantile]
        }}
      />
    )
  })

  return (
    <div className='careerflowunitfold-main-div'>
      {proportionDivList}
    </div>
  )
}

export default CareerflowUnitFold;
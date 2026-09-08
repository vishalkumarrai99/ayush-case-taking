
export const loadCaseState = () => {
  try {
    const savedCase = localStorage.getItem('ayush-case-data')

    if (!savedCase) {
      return undefined
    }

    return {
      case: JSON.parse(savedCase),
    }
  } catch (error) {
    console.error('Failed to load case data:', error)

    return undefined
  }
}

export const saveCaseState = (caseState) => {
  try {
    localStorage.setItem(
      'ayush-case-data',
      JSON.stringify(caseState)
    )
  } catch (error) {
    console.error('Failed to save case data:', error)
  }
}


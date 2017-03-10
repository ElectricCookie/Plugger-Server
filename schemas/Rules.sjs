Rules{
	
	#Item{
		id: str()
		title: str()
		scenes: str[]() 
		condition: @Condition
		state: boolean()
		priority: nr()
	}

	#Condition{
		// AND, OR, SENSOR_VALUE, SCENE_STATE, TIME, DATE, MONTH, YEAR, DAY
		type: str()

		// SENSOR , SCENE / Id
		?id: str()

		// IS, IS_NOT, LESS, GREATER
		?operator: str()

		// actual value
		?value: str()

		// AND OR
		children: @Condition[]

	}



	


}
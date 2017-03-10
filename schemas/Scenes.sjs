Scenes{
		
	#Item{
		id: str()
		title: str()
		priority: nr()
		deviceStates: @DeviceState[]
		active: boolean()

	}

	#DeviceState{
		id: str()
		value: str()
	}

	
}
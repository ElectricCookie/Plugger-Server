Scene: 
{
	id: str
	title: str
	priority: int
	active: bool
	ticks: bool
	currentTick: int
	tickDuration: int
	deviceStates: [
		{
			id: str
			value: str
			tick: int
		}
	]
}

Device: 
{
	id: str
	title: str
	value: str
	type: str
}

Rule: 
{
	id:  str
	title: str
	targetScenes: []
	conditions: @Condition[]
}

Condition: 
{
	type: str() // OR, AND, TIME, SENSOR_VALUE, INPUT_VALUE
	operator: str() // GT, IS, NOT, LT
	children: @Condition[]
	compare: str()
	id: str()
}


Sensor: 
{
	id: str()
	type: str()
	unit: str()
	value: str()
	lastValue: str()
	updated: int()
}

Inputs: 
{
	id: str()
	title: str()
	type: str() // Slider10, Slider255, Switch, Select
	options: @Option[]


}

Option{
	title: str()
	value: str()
}
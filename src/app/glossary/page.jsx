'use client'

import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { useDarkDawnData } from '@/lib/hooks/useDarkDawnData'

const GlossaryPage = () => {
  const { data, loading, error } = useDarkDawnData()

  // State for selected items in each category
  const [selectedClass, setSelectedClass] = useState(null)
  const [selectedRace, setSelectedRace] = useState(null)
  const [selectedFaction, setSelectedFaction] = useState(null)
  const [selectedDeity, setSelectedDeity] = useState(null)
  const [selectedAbility, setSelectedAbility] = useState(null)

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading Dark Dawn data...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-500">Error loading data: {error.message}</div>
      </div>
    )
  }

  // Helper function to render difficulty stars
  const renderDifficultyStars = (difficulty) => {
    const difficultyNum = parseInt(difficulty) || 0
    const maxStars = 5
    const filledStars = '★'.repeat(difficultyNum)
    const emptyStars = '☆'.repeat(maxStars - difficultyNum)

    return (
      <span className="text-xl">
        {filledStars}{emptyStars} <span className="text-base text-muted-foreground">({difficultyNum}/5)</span>
      </span>
    )
  }

  // Helper function to render item details
  const renderDetails = (item, type) => {
    if (!item) {
      return <div className="text-muted-foreground text-center py-8">Select an item from the dropdown above</div>
    }

    return (
      <div className="space-y-4">
        {/* Name - Title */}
        <div className="border-b pb-2">
          <h3 className="text-2xl font-bold">{item.name}</h3>
        </div>

        {/* Class-specific attributes */}
        {type === 'class' && (
          <>
            {item.role && (
              <div>
                <h4 className="text-lg font-semibold mb-1">Role</h4>
                <p className="text-muted-foreground">{item.role}</p>
              </div>
            )}
            {item.secondaryRole && (
              <div>
                <h4 className="text-lg font-semibold mb-1">Secondary Role</h4>
                <p className="text-muted-foreground">{item.secondaryRole}</p>
              </div>
            )}
            {item.mainStats && (
              <div>
                <h4 className="text-lg font-semibold mb-1">Main Stats</h4>
                <p className="text-muted-foreground">{item.mainStats}</p>
              </div>
            )}
            {item.difficulty && (
              <div>
                <h4 className="text-lg font-semibold mb-1">Difficulty</h4>
                <div>{renderDifficultyStars(item.difficulty)}</div>
              </div>
            )}
          </>
        )}

        {/* Faction-specific attributes */}
        {type === 'faction' && item.abilities && (
          <div>
            <h4 className="text-lg font-semibold mb-2">Abilities</h4>
            <div className="space-y-3 ml-2">
              {item.abilities.map((ability, index) => (
                <div key={index} className="border-l-2 border-primary pl-3 py-1">
                  <div className="font-semibold">{ability.name}</div>
                  {ability.description && (
                    <div
                      className="text-sm text-muted-foreground mt-1 html-description"
                      dangerouslySetInnerHTML={{ __html: ability.description }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Deity-specific attributes */}
        {type === 'deity' && item.bonuses && (
          <div>
            <h4 className="text-lg font-semibold mb-2">Bonuses</h4>
            <div className="space-y-3 ml-2">
              {item.bonuses.map((bonus, index) => (
                <div key={index} className="border-l-2 border-primary pl-3 py-1">
                  {bonus.devotion && (
                    <div className="mb-1">
                      <span className="font-semibold">Devotion:</span>{' '}
                      <span
                        className="text-muted-foreground html-description"
                        dangerouslySetInnerHTML={{ __html: bonus.devotion }}
                      />
                    </div>
                  )}
                  {bonus.effect && (
                    <div className="mb-1">
                      <span className="font-semibold">Effect:</span>{' '}
                      <span
                        className="text-muted-foreground html-description"
                        dangerouslySetInnerHTML={{ __html: bonus.effect }}
                      />
                    </div>
                  )}
                  {bonus.fanaticism && (
                    <div className="mb-1">
                      <span className="font-semibold">Fanaticism:</span>{' '}
                      <span
                        className="text-muted-foreground html-description"
                        dangerouslySetInnerHTML={{ __html: bonus.fanaticism }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Description (common for all types) */}
        {item.description && item.description !== 'undefined' && (
          <div>
            <h4 className="text-lg font-semibold mb-1">Description</h4>
            <div
              className="text-muted-foreground html-description"
              dangerouslySetInnerHTML={{ __html: item.description }}
            />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Dark Dawn Glossary</h1>

      <Tabs defaultValue="classes" className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-6">
          <TabsTrigger value="classes">Classes</TabsTrigger>
          <TabsTrigger value="races">Races</TabsTrigger>
          <TabsTrigger value="factions">Factions</TabsTrigger>
          <TabsTrigger value="deities">Deities</TabsTrigger>
          <TabsTrigger value="abilities">Special Abilities</TabsTrigger>
        </TabsList>

        {/* Classes Tab */}
        <TabsContent value="classes">
          <Card className="p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-4">Classes</h2>
              <Select onValueChange={(key) => setSelectedClass(data.classes[key])}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a class..." />
                </SelectTrigger>
                <SelectContent>
                  {data.classes && Object.keys(data.classes).map((key) => (
                    <SelectItem key={key} value={key}>
                      {data.classes[key].name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {renderDetails(selectedClass, 'class')}
          </Card>
        </TabsContent>

        {/* Races Tab */}
        <TabsContent value="races">
          <Card className="p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-4">Races</h2>
              <Select onValueChange={(key) => setSelectedRace(data.races[key])}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a race..." />
                </SelectTrigger>
                <SelectContent>
                  {data.races && Object.keys(data.races).map((key) => (
                    <SelectItem key={key} value={key}>
                      {data.races[key].name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {renderDetails(selectedRace, 'race')}
          </Card>
        </TabsContent>

        {/* Factions Tab */}
        <TabsContent value="factions">
          <Card className="p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-4">Factions</h2>
              <Select onValueChange={(key) => setSelectedFaction(data.factions[key])}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a faction..." />
                </SelectTrigger>
                <SelectContent>
                  {data.factions && Object.keys(data.factions).map((key) => (
                    <SelectItem key={key} value={key}>
                      {data.factions[key].name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {renderDetails(selectedFaction, 'faction')}
          </Card>
        </TabsContent>

        {/* Deities Tab */}
        <TabsContent value="deities">
          <Card className="p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-4">Deities</h2>
              <Select onValueChange={(key) => setSelectedDeity(data.deities[key])}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a deity..." />
                </SelectTrigger>
                <SelectContent>
                  {data.deities && Object.keys(data.deities).map((key) => (
                    <SelectItem key={key} value={key}>
                      {data.deities[key].name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {renderDetails(selectedDeity, 'deity')}
          </Card>
        </TabsContent>

        {/* Special Abilities Tab */}
        <TabsContent value="abilities">
          <Card className="p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-4">Special Abilities</h2>
              <Select onValueChange={(key) => setSelectedAbility(data.specialAbilities[key])}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a special ability..." />
                </SelectTrigger>
                <SelectContent>
                  {data.specialAbilities && Object.keys(data.specialAbilities).map((key) => (
                    <SelectItem key={key} value={key}>
                      {data.specialAbilities[key].name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {renderDetails(selectedAbility, 'ability')}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default GlossaryPage
